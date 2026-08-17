'use server'

import { GoogleGenAI } from '@google/genai'
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
 * instruction, so the assistant is quoting the same stock and prices the
 * storefront shows — it cannot place an order or touch the database, only
 * describe what is there. Google Search grounding is the other half: for
 * anything outside the catalogue (competitor pricing, general inverter and
 * solar questions) the model searches the live web itself and cites what it
 * finds.
 */

/**
 * Gemini 2.5 Flash rather than a newer model, and the reason is the search
 * bill: grounding is free on this model up to 500 requests a day, and
 * chargeable on the 3.x line. Overridable so trying another one is an env
 * change — but read the grounding pricing before moving off it.
 */
const MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash'

/** Covers the answer only — thinking is turned off below, so this is not
    shared with a reasoning budget the way the OpenAI version's was. */
const MAX_OUTPUT_TOKENS = 2000

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

function systemInstruction(products, isInstaller) {
  return `You are the shopping assistant for VIP Solar, a Philippine retailer of solar inverters, batteries and accessories.

Help the person browsing find the right equipment: answer questions about the products below, compare options against each other and against what's on the wider market, and use Google Search for anything outside this catalogue (competitor products, general inverter/solar/battery questions, current market prices). Cite what you find when you search.

You cannot place an order, change a price, or check someone's personal order history — direct that to "Customer support" in the launcher next to this chat. Prices shown are VAT-exclusive; 12% VAT is added at checkout.

Current catalogue${isInstaller ? ' (installer/trade pricing shown)' : ''}:
${catalogueContext(products, isInstaller)}

Keep answers focused and conversational — this is a chat widget, not a report.`
}

/**
 * The dialog stores turns as `assistant`; Gemini calls that role `model` and
 * rejects anything else. One line, and the whole conversation history is
 * either understood or thrown out — so it lives in its own function rather
 * than inline where a later edit could quietly drop it.
 */
function toGeminiContents(turns) {
  return turns.map((turn) => ({
    role: turn.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(turn.text ?? '').trim() }],
  }))
}

export async function askAssistant(history) {
  if (!process.env.GEMINI_API_KEY) {
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

  // Reads GEMINI_API_KEY from the environment. Server-side only — the key is
  // unprefixed precisely so it can never reach the browser.
  const ai = new GoogleGenAI({})

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: toGeminiContents(turns),
      config: {
        systemInstruction: systemInstruction(products, isInstaller),
        tools: [{ googleSearch: {} }],
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        // A product question in a chat widget does not need a reasoning pass,
        // and the customer is watching a spinner while it runs. `thinkingBudget`
        // is the 2.5-series control; the 3.x line uses `thinkingLevel` instead.
        thinkingConfig: { thinkingBudget: 0 },
      },
    })

    // Safety filters can stop a turn before any text exists. Saying "no answer
    // came back" would read as a bug rather than a refusal.
    const blocked = response.promptFeedback?.blockReason ?? response.candidates?.[0]?.finishReason
    const reply = response.text?.trim()

    if (!reply) {
      if (blocked && blocked !== 'STOP') {
        console.warn('[assistant] the turn was stopped:', blocked)
        return { error: "That's not something I can help with here. Try Customer support instead." }
      }
      return { error: 'No answer came back. Try rephrasing the question.' }
    }

    return { reply }
  } catch (error) {
    // Specific in the server log, vague to the customer — same reasoning as
    // sendSupportRequest(). Every branch below is our configuration problem
    // rather than anything they did.
    const status = error?.status ?? error?.code
    const message = String(error?.message ?? '')

    if (status === 400 && /api[_ ]?key/i.test(message)) {
      console.error('[assistant] GEMINI_API_KEY was rejected. Check the key in .env.local.')
    } else if (status === 429) {
      console.error('[assistant] rate limited by Gemini — the free tier caps requests per minute and per day.')
    } else if (status === 404) {
      console.error(`[assistant] the model "${MODEL}" is not available to this key.`)
    } else {
      console.error('[assistant] the request failed:', message || error)
    }

    return { error: 'The assistant is having trouble right now. Try again in a moment, or use Customer support.' }
  }
}
