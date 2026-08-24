/**
 * Order pricing — one module, two callers.
 *
 * The product page prices a quote in the browser so the summary appears the
 * moment someone presses Checkout, and createOrder() recomputes the
 * identical figures on the server from the database's own prices before it
 * writes an order. Because both run this code, the number a customer agreed
 * to and the number they are charged cannot drift — the browser's copy is
 * only ever a preview of an answer the server reaches on its own, from rows
 * the client never got to touch.
 *
 * Everything works in whole centavos internally. Peso amounts come out of
 * Postgres `numeric` as JS floats, and 12 % of a float is exactly where a
 * one-centavo disagreement between the summary and the receipt would start.
 */

/**
 * Catalogue prices are VAT-exclusive: products.retail_price and
 * installer_price are both net of tax, and the 12 % is added at checkout.
 *
 * If this ever becomes a VAT-exempt sale — RA 9513 zero-rates renewable
 * energy equipment, so it plausibly might — it is this constant and the label
 * next to it in the summary that change, not the arithmetic below.
 */
export const VAT_RATE = 0.12

const toCentavos = (amount) => Math.round(Number(amount) * 100)
const toPesos = (amount) => amount / 100

/** Peso amounts read the same everywhere they are shown. */
export const formatPeso = (amount) =>
  amount == null ? '—' : new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount))

/**
 * The shelf price — VAT folded in, the way DTI's price-tag rules expect what
 * a shopper reads on a listing to already be what they pay. Catalogue prices
 * stay VAT-exclusive in the database and in quote() itself, so the receipt
 * can still itemise the tax separately at the point of commitment; this is
 * only for the figure shown before that, on the grid and the product page.
 */
export const withVat = (amount) => toPesos(Math.round(toCentavos(amount) * (1 + VAT_RATE)))

/**
 * Who gets trade pricing.
 *
 * Deliberately the same test createOrder() has used since it was
 * written — customer_type alone, not verification_status — so the price on
 * the product page is the price the order is written at. Requiring a cleared
 * verification before trade pricing applies is a policy change rather than a
 * bug fix, and when it happens it happens here, once, for both callers.
 */
export function hasInstallerPricing(profile) {
  return profile?.customer_type === 'installer'
}

/**
 * Whether this product has a price yet.
 *
 * A row can exist in the catalogue before anybody has decided what it sells
 * for — the range is loaded from the manufacturer's datasheets, and the
 * pesos are set afterwards in the Maintenance tab. Those rows carry
 * retail_price 0, which is not a price: nothing here is free, so zero can
 * only mean "not yet priced".
 *
 * The storefront asks this before it shows a figure, and createOrder
 * asks it again before it writes an order, so an unpriced product can be read
 * about but not bought. Setting a real price is the only thing needed to turn
 * one into a live line — there is no second flag to remember.
 */
export function isPriced(product) {
  const retail = Number(product?.retail_price)
  return Number.isFinite(retail) && retail > 0
}

/**
 * The price one unit actually sells for. Trade price when there is one and
 * the buyer is entitled to it, list price otherwise — a product with no
 * installer_price is simply never discounted.
 */
export function unitPriceOf(product, isInstaller) {
  const installer = product?.installer_price
  return isInstaller && installer != null ? Number(installer) : Number(product?.retail_price)
}

/**
 * quote({ lines, isInstaller })
 *
 * lines: [{ product, quantity }] — product rows as they come from
 *   `products`, not prices chosen by whoever is calling.
 *
 * Returns, in pesos:
 *   items           per-line unit price, list price and what the trade price took off
 *   retailSubtotal  what this order costs at list price
 *   discount        what trade pricing takes off it — 0 for a homeowner
 *   subtotal        retailSubtotal - discount, still VAT-exclusive
 *   vat             12 % of the subtotal, rounded once at the bottom rather
 *                   than per line, so the parts always add up to the whole
 *   total           what is due
 */
export function quote({ lines, isInstaller = false }) {
  let retailCentavos = 0
  let netCentavos = 0

  const items = (lines ?? []).map(({ product, quantity }) => {
    const count = Number(quantity)
    const retailUnit = toCentavos(product.retail_price)
    const unit = toCentavos(unitPriceOf(product, isInstaller))

    const lineRetail = retailUnit * count
    const lineNet = unit * count

    retailCentavos += lineRetail
    netCentavos += lineNet

    return {
      product,
      quantity: count,
      retailUnitPrice: toPesos(retailUnit),
      unitPrice: toPesos(unit),
      lineRetailTotal: toPesos(lineRetail),
      lineTotal: toPesos(lineNet),
      lineDiscount: toPesos(lineRetail - lineNet),
    }
  })

  const vatCentavos = Math.round(netCentavos * VAT_RATE)

  return {
    items,
    isInstaller,
    retailSubtotal: toPesos(retailCentavos),
    discount: toPesos(retailCentavos - netCentavos),
    subtotal: toPesos(netCentavos),
    vat: toPesos(vatCentavos),
    total: toPesos(netCentavos + vatCentavos),
  }
}
