'use server'

import OpenAI from 'openai'
import { createClient } from '@/utils/supabase/server'
import { getStorefront } from '@/app/actions/catalogue'
import { formatPeso } from '@/utils/pricing'
import { HISTORY_LIMIT, MESSAGE_LIMIT, MESSAGE_MINIMUM } from '@/utils/assistant/limits'

/**
 * The shopping assistant behind the "Assistant" launcher, next to (not
 * instead of) the human support form: this one answers "which of these two
 * do I need" and "what's the going rate for a 5kW hybrid inverter" while
 * someone is still deciding, rather than after something has gone wrong.
 *
 * The catalogue is read fresh on every turn and folded into the instructions,
 * so the assistant is quoting the same stock and prices the storefront shows
 * — it cannot place an order or touch the database, only describe what is
 * there. Web search is the other half: for anything outside the catalogue
 * (competitor pricing, general inverter/solar questions) the model searches
 * the live web itself and cites what it finds.
 *
 * Runs on OpenAI's Responses API rather than Chat Completions, because
 * `web_search` is a first-class hosted tool there — the search executes on
 * OpenAI's side and the results come back in the same response, with no
 * second round trip to write here.
 */

/** Overridable without a deploy, so trying a cheaper or newer model is an
    env change rather than a code change. */
const MODEL = process.env.OPENAI_MODEL?.trim() || 'gpt-5.5'

/**
 * Reasoning tokens are billed and counted as output on the gpt-5 family, so
 * this ceiling covers the thinking as well as the answer. Set well above what
 * a chat reply needs: too low and the budget is spent reasoning, leaving an
 * empty message rather than a short one.
 */
const MAX_OUTPUT_TOKENS = 4000

function catalogueContext(products, isInstaller) {
  if (!products?.length) return 'The catalogue is empty right now.'

  return products
    .map((p) => {
      const price = isInstaller && p.installer_price != null ? p.installer_price : p.retail_price
      const stock = p.stock_quantity === 0 ? 'out of stock' : `${p.stock_quantity} in stock`
      const specs = Array.isArray(p.specifications) && p.specifications.length ? p.specifications.join('; ') : null
      return [
        `- ${p.name} — ${formatPeso(price)} (VAT-exclusive, ${stock})`,
        p.description ? `  ${p.description}` : null,
        specs ? `  Specs: ${specs}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')
}

function instructions(products, isInstaller) {
  return `You are the shopping assistant for VIP Solar, a Philippine retailer of solar inverters, batteries and accessories.

Help the person browsing find the right equipment: answer questions about the products below, compare options against each other and against what's on the wider market, and use web search for anything outside this catalogue (competitor products, general inverter/solar/battery questions, current market prices). Cite what you find when you search.

You cannot place an order, change a price, or check someone's personal order history — direct that to "Customer support" in the launcher next to this chat. Prices shown are VAT-exclusive; 12% VAT is added at checkout.

Current catalogue${isInstaller ? ' (installer/trade pricing shown)' : ''}:
${catalogueContext(products, isInstaller)}

Keep answers focused and conversational — this is a chat widget, not a report.`
}

/**
 * Pull the assistant's prose out of a Responses result.
 *
 * `output_text` is the SDK's convenience getter and is what this normally
 * reads. The manual walk is the fallback: `output` also carries the web
 * search calls and any reasoning items, and only `output_text` blocks inside
 * `message` items are the reply.
 */
function readReply(response) {
  const convenience = response?.output_text
  if (typeof convenience === 'string' && convenience.trim()) return convenience.trim()

  return (response?.output ?? [])
    .filter((item) => item.type === 'message')
    .flatMap((item) => item.content ?? [])
    .filter((block) => block.type === 'output_text')
    .map((block) => block.text)
    .join('\n\n')
    .trim()
}

export async function askAssistant(history) {
  if (!process.env.OPENAI_API_KEY) {
    return { error: 'The assistant is not configured yet. Try Customer support instead.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Log in first to use the assistant.' }

  const turns = Array.isArray(history) ? history.slice(-HISTORY_LIMIT) : []
  const last = turns[turns.length - 1]

  if (!last || last.role !== 'user') return { error: 'Something went wrong. Try again.' }

  const text = String(last.text ?? '').trim()
  if (text.length < MESSAGE_MINIMUM) return { error: 'Ask a full question.' }
  if (text.length > MESSAGE_LIMIT) return { error: `Keep questions under ${MESSAGE_LIMIT} characters.` }

  const { data: products, isInstaller } = await getStorefront()

  const client = new OpenAI()

  try {
    const response = await client.responses.create({
      model: MODEL,
      instructions: instructions(products, isInstaller),
      // The whole visible conversation, so a follow-up like "and the bigger
      // one?" still has the product it refers to.
      input: turns.map((turn) => ({
        role: turn.role,
        content: String(turn.text ?? '').trim(),
      })),
      tools: [{ type: 'web_search' }],
      // Low rather than the default: this is a product question in a chat
      // widget, and the customer is watching a spinner while it thinks.
      reasoning: { effort: 'low' },
      max_output_tokens: MAX_OUTPUT_TOKENS,
    })

    // The budget ran out inside the reasoning, before any prose. Saying
    // "no answer" would be misleading — the model was still working.
    if (response.status === 'incomplete' && !readReply(response)) {
      console.warn('[assistant] response was cut short:', response.incomplete_details?.reason)
      return { error: 'That answer got too long. Try asking something narrower.' }
    }

    const reply = readReply(response)
    if (!reply) return { error: 'No answer came back. Try rephrasing the question.' }

    return { reply }
  } catch (error) {
    // Specific in the server log, vague to the customer — same reasoning as
    // sendSupportRequest(). Every branch below is our configuration problem
    // rather than anything they did, and naming it would tell them about our
    // billing rather than about their question.
    const status = error?.status
    const code = error?.code ?? error?.error?.code

    if (status === 401) {
      console.error('[assistant] OPENAI_API_KEY was rejected. Check the key in .env.local.')
    } else if (code === 'insufficient_quota') {
      console.error('[assistant] the OpenAI account is out of quota — add billing credit to resume.')
    } else if (status === 429) {
      console.error('[assistant] rate limited by OpenAI; the request was not answered.')
    } else if (status === 404) {
      console.error(`[assistant] the model "${MODEL}" is not available to this account.`)
    } else {
      console.error('[assistant] the request failed:', error?.message ?? error)
    }

    return { error: 'The assistant is having trouble right now. Try again in a moment, or use Customer support.' }
  }
}
