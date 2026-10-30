import { cache } from "react";
import { client } from "./catalog";
import { DEFAULT_SETTINGS, DELIVERY_IDS } from "./site-defaults";

// The settings document lives at the root path (ID "siteSettings"), so it is
// public — keep only public information in it (no alert emails or keys).
const QUERY = `*[_id == "siteSettings"][0]{
  whatsappNumbers, contactEmail, warrantyMonths, returnDays,
  deliveryOptions[]{ id, label, detail, fee, enabled }
}`;

function merge(doc) {
  const d = doc || {};
  const numbers = (d.whatsappNumbers || []).map((n) => String(n).trim()).filter(Boolean);
  const delivery = DEFAULT_SETTINGS.deliveryOptions
    .map((base) => {
      const o = (d.deliveryOptions || []).find((x) => x?.id === base.id) || {};
      const fee = Number(o.fee);
      return {
        id: base.id,
        label: o.label || base.label,
        detail: o.detail || base.detail,
        fee: Number.isFinite(fee) && fee >= 0 ? fee : base.fee,
        enabled: o.enabled ?? base.enabled,
      };
    })
    .filter((o) => DELIVERY_IDS.includes(o.id) && o.enabled);
  return {
    whatsappNumbers: numbers.length ? numbers : DEFAULT_SETTINGS.whatsappNumbers,
    contactEmail: d.contactEmail || DEFAULT_SETTINGS.contactEmail,
    warrantyMonths: Number(d.warrantyMonths) > 0 ? Number(d.warrantyMonths) : DEFAULT_SETTINGS.warrantyMonths,
    returnDays: Number(d.returnDays) > 0 ? Number(d.returnDays) : DEFAULT_SETTINGS.returnDays,
    deliveryOptions: delivery.length ? delivery : DEFAULT_SETTINGS.deliveryOptions,
  };
}

/** Settings for rendering pages (cached like the catalogue). */
export const getSiteSettings = cache(async () => {
  if (!client) return merge(null);
  try {
    return merge(await client.fetch(QUERY, {}, { next: { revalidate: 60, tags: ["settings"] } }));
  } catch (e) {
    console.error("[settings] unavailable — using defaults", e?.message);
    return merge(null);
  }
});

/** Settings for pricing a payment: always fresh, so a fee change applies immediately. */
export async function getSettingsForPricing() {
  if (!client) return merge(null);
  return merge(await client.withConfig({ useCdn: false }).fetch(QUERY, {}, { cache: "no-store" }));
}
