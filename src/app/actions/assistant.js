'use server'

import Anthropic from '@anthropic-ai/sdk'
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
 * The catalogue is read fresh on every turn and folded into the system
 * prompt, so the assistant is quoting the same stock and prices the storefront
 * shows — it cannot place an order or touch the database, only describe what
 * is there. Web search is the other half: for anything outside the
 * catalogue (competitor pricing, general inverter/solar questions) Claude
 * searches the live web itself and cites what it finds.
 */

const MODEL = 'claude-opus-5'

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

function systemPrompt(products, isInstaller) {
  return `You are the shopping assistant for VIP Solar, a Philippine retailer of solar inverters, batteries and accessories.

Help the person browsing find the right equipment: answer questions about the products below, compare options against each other and against what's on the wider market, and use web search for anything outside this catalogue (competitor products, general inverter/solar/battery questions, current market prices). Cite what you find when you search.

You cannot place an order, change a price, or check someone's personal order history — direct that to "Customer support" in the launcher next to this chat. Prices shown are VAT-exclusive; 12% VAT is added at checkout.

Current catalogue${isInstaller ? ' (installer/trade pricing shown)' : ''}:
${catalogueContext(products, isInstaller)}

Keep answers focused and conversational — this is a chat widget, not a report.`
}

export async function askAssistant(history) {
  if (!process.env.ANTHROPIC_API_KEY) {
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

  const messages = turns.map((turn) => ({
    role: turn.role,
    content: String(turn.text ?? '').trim(),
  }))

  const client = new Anthropic()

  try {
    let response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: systemPrompt(products, isInstaller),
      output_config: { effort: 'medium' },
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3 }],
      messages,
    })

    // A long tool-search turn can pause rather than finish; re-send to
    // let the server-side loop pick up where it left off.
    while (response.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: response.content })
      response = await client.messages.create({
        model: MODEL,
        max_tokens: 2000,
        system: systemPrompt(products, isInstaller),
        output_config: { effort: 'medium' },
        tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3 }],
        messages,
      })
    }

    if (response.stop_reason === 'refusal') {
      return { error: "That's not something I can help with here. Try Customer support instead." }
    }

    const reply = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n\n')
      .trim()

    if (!reply) return { error: 'No answer came back. Try rephrasing the question.' }

    return { reply }
  } catch {
    // Vague to the customer, same reasoning as sendSupportRequest(): the
    // cause is a configuration or upstream problem, not theirs to see.
    return { error: 'The assistant is having trouble right now. Try again in a moment, or use Customer support.' }
  }
}
