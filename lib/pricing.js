import { toMinor } from "./format";

import { DEFAULT_SETTINGS } from "./site-defaults";

// Delivery options come from Site settings in the Studio (fresh for every payment);
// these defaults apply until it's filled in.
export const SHIPPING_OPTIONS = DEFAULT_SETTINGS.deliveryOptions;

export const MAX_LINES = 50;
export const MAX_QTY_PER_LINE = 20;

/**
 * Price a cart against the authoritative catalogue. Amounts are integer
 * pesewas. Anything the client claimed (price, stock) is ignored except to
 * report that it changed.
 *
 * @returns {{ error?: string, lines, issues, shipping, subtotalMinor, shippingMinor, totalMinor }}
 */
export function priceCart(rawItems, catalog, shippingId = "standard", options = SHIPPING_OPTIONS) {
  const shipping = options.find((s) => s.id === shippingId);
  if (!shipping) return { error: "Invalid delivery option" };
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > MAX_LINES)
    return { error: "Your bag is empty or invalid" };

  const lines = [];
  const issues = [];
  const seen = new Set();

  for (const raw of rawItems) {
    const id = typeof raw?.id === "string" ? raw.id : null;
    if (!id || seen.has(id)) continue;
    seen.add(id);

    const qty = Number(raw.qty);
    const product = catalog.find((p) => p.id === id);
    if (!product) {
      issues.push({ id, type: "removed", message: "An item in your bag is no longer available and was removed." });
      continue;
    }
    if (!Number.isInteger(qty) || qty < 1) {
      issues.push({ id, type: "invalid", message: `${product.name} had an invalid quantity and was removed.` });
      continue;
    }
    if (product.stock < 1) {
      issues.push({ id, type: "out_of_stock", message: `${product.name} just sold out and was removed.` });
      continue;
    }
    const finalQty = Math.min(qty, product.stock, MAX_QTY_PER_LINE);
    if (finalQty < qty)
      issues.push({ id, type: "qty_reduced", message: `Only ${finalQty} × ${product.name} available — quantity updated.` });
    if (raw.price != null && Number(raw.price) !== product.price)
      issues.push({ id, type: "price_changed", message: `The price of ${product.name} has been updated.` });

    const unitMinor = toMinor(product.price);
    lines.push({
      id,
      docId: product.docId ?? null,
      name: product.name,
      image: product.image,
      price: product.price,
      stock: product.stock,
      qty: finalQty,
      unitMinor,
      lineMinor: unitMinor * finalQty,
    });
  }

  const subtotalMinor = lines.reduce((n, l) => n + l.lineMinor, 0);
  const shippingMinor = toMinor(shipping.fee);
  return {
    lines,
    issues,
    shipping,
    subtotalMinor,
    shippingMinor,
    totalMinor: subtotalMinor + shippingMinor,
  };
}
