const cedis = new Intl.NumberFormat("en-GH", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Format a cedi amount for display, e.g. 4500 -> "GH₵ 4,500". */
export const money = (amount) => "GH₵ " + cedis.format(Number(amount || 0));

/** Format a pesewa (minor unit) amount for display. */
export const moneyMinor = (minor) => money(Number(minor || 0) / 100);

/** Cedis -> pesewas. All server-side totals are computed in integer pesewas. */
export const toMinor = (amount) => Math.round(Number(amount || 0) * 100);

export function discountPercent(price, originalPrice) {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round((1 - price / originalPrice) * 100);
}
