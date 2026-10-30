// Orders without a database:
//  • Paystack holds the payment and, in its metadata, the server-priced order.
//  • Sanity holds a private copy (ID "order.<ref>", token-only) that the owner
//    manages in the Studio, and stock is decremented in the same transaction.
import crypto from "node:crypto";
import { paystack } from "./paystack";
import { getWriteClient, orderDocId } from "./sanity-server";
import { SHIPPING_OPTIONS } from "./pricing";
import { after } from "next/server";
import { notifyPaidOrder, notifyPaymentMismatch } from "./notify";

/** Run work after the response is sent (Next `after`), or inline outside a request. */
function schedule(task) {
  const run = () => task().catch((e) => console.error("[orders] background task failed", e?.message));
  try {
    after(run);
  } catch {
    return run();
  }
}

/** Plain order shape used by notifications. */
function orderView(reference, tx, meta) {
  const o = meta.order;
  return {
    reference,
    customer: {
      name: meta.customer?.name ?? "",
      email: String(tx.customer?.email ?? "").toLowerCase(),
      phone: meta.customer?.phone ?? "",
      address: meta.customer?.address ?? "",
    },
    shippingLabel: o.shippingLabel || SHIPPING_OPTIONS.find((s) => s.id === o.shipping)?.label || o.shipping,
    lines: o.lines.map((l) => ({ name: l.n, qty: l.q, unitMinor: l.u })),
    subtotalMinor: o.subtotalMinor,
    shippingMinor: o.shippingMinor,
    totalMinor: o.totalMinor,
  };
}

/* ---------------------------------------------------------------- references */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — easy to read out on the phone

/** Human-friendly order reference, e.g. LTR-7KQ2M9XA. Also the Paystack reference. */
export function createReference() {
  const bytes = crypto.randomBytes(8);
  let code = "";
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return `LTR-${code}`;
}

export const normalizeReference = (ref) => String(ref || "").trim().toUpperCase();

/* ------------------------------------------------------------------ metadata */

/** Everything needed to fulfil the order, attached to the Paystack transaction by the server. */
export function buildMetadata({ quote, contact, shipping }) {
  return {
    order: {
      v: 1,
      shipping,
      shippingLabel: quote.shipping.label,
      subtotalMinor: quote.subtotalMinor,
      shippingMinor: quote.shippingMinor,
      totalMinor: quote.totalMinor,
      lines: quote.lines.map((l) => ({ id: l.id, d: l.docId, n: l.name, q: l.qty, u: l.unitMinor })),
    },
    customer: { name: contact.name, phone: contact.phone, address: contact.address },
    // Shown on the transaction in the Paystack dashboard.
    custom_fields: [
      { display_name: "Customer", variable_name: "customer_name", value: contact.name },
      { display_name: "Phone", variable_name: "customer_phone", value: contact.phone },
      { display_name: "Delivery", variable_name: "delivery", value: quote.shipping.label },
      ...(contact.address ? [{ display_name: "Address", variable_name: "address", value: contact.address }] : []),
      {
        display_name: "Items",
        variable_name: "items",
        value: quote.lines.map((l) => `${l.qty}× ${l.name}`).join(", "),
      },
    ],
  };
}

function readMetadata(tx) {
  let meta = tx?.metadata;
  if (typeof meta === "string") {
    try {
      meta = JSON.parse(meta);
    } catch {
      return null;
    }
  }
  if (!meta?.order?.lines?.length) return null;
  // Paystack hands metadata back with numbers turned into strings ("812000"),
  // so coerce every numeric field before any comparison or arithmetic.
  const int = (v) => Math.round(Number(v));
  const o = meta.order;
  return {
    ...meta,
    order: {
      ...o,
      subtotalMinor: int(o.subtotalMinor),
      shippingMinor: int(o.shippingMinor),
      totalMinor: int(o.totalMinor),
      lines: o.lines.map((l) => ({ ...l, q: int(l.q), u: int(l.u), d: l.d || null })),
    },
  };
}

/** Non-sensitive summary for the confirmation and tracking pages. */
export function summaryFromMeta(meta) {
  return {
    items: meta.order.lines.map((l) => ({ id: l.id, name: l.n, qty: l.q })),
    totalMinor: meta.order.totalMinor,
    shipping: meta.order.shipping,
    shippingLabel:
      meta.order.shippingLabel || SHIPPING_OPTIONS.find((s) => s.id === meta.order.shipping)?.label || meta.order.shipping,
  };
}

/* ------------------------------------------------------------------ recording */

function orderDocument(reference, tx, meta, status) {
  const o = meta.order;
  const label = o.shippingLabel || SHIPPING_OPTIONS.find((s) => s.id === o.shipping)?.label || o.shipping;
  return {
    _id: orderDocId(reference),
    _type: "order",
    reference,
    status,
    customer: {
      name: meta.customer?.name ?? "",
      email: String(tx.customer?.email ?? "").toLowerCase(),
      phone: meta.customer?.phone ?? "",
    },
    delivery: { method: o.shipping, label, address: meta.customer?.address ?? "" },
    items: o.lines.map((l, i) => ({
      _key: `l${i}`,
      _type: "orderItem",
      productId: l.id,
      name: l.n,
      qty: l.q,
      unitPrice: l.u / 100,
    })),
    subtotal: o.subtotalMinor / 100,
    deliveryFee: o.shippingMinor / 100,
    total: Number(tx.amount) / 100,
    totalMinor: Number(tx.amount),
    paidAt: tx.paid_at || tx.paidAt || new Date().toISOString(),
    paymentChannel: tx.channel ?? null,
    stockAdjusted: false,
  };
}

const isConflict = (e) => e?.statusCode === 409 || /already exists/i.test(String(e?.message));

/**
 * Stock patches for each line: the published product, plus any open draft of it.
 * Without the draft patch, publishing a product someone was editing in Studio
 * would silently restore the old stock number and oversell.
 */
async function stockPatches(client, lines) {
  if (!lines.length) return [];
  const draftIds = lines.map((l) => `drafts.${l.d}`);
  const openDrafts = new Set(
    await client.withConfig({ perspective: "raw" }).fetch(`*[_id in $ids]._id`, { ids: draftIds }).catch(() => []),
  );
  return lines.flatMap((l) => [
    { id: l.d, qty: l.q },
    ...(openDrafts.has(`drafts.${l.d}`) ? [{ id: `drafts.${l.d}`, qty: l.q }] : []),
  ]);
}

/**
 * Create the private order document and decrement stock — once.
 * `create` fails if the document exists, so a repeated webhook or a refresh of
 * the confirmation page can never double-count stock.
 */
async function recordOrder(reference, tx, meta, status) {
  const client = getWriteClient();
  if (!client) return { saved: false, reason: "no-sanity-token" };

  const doc = orderDocument(reference, tx, meta, status);
  const adjust = status === "paid" ? meta.order.lines.filter((l) => l.d) : [];

  try {
    const patches = await stockPatches(client, adjust);
    const t = client.transaction().create({ ...doc, stockAdjusted: adjust.length > 0 });
    for (const s of patches) t.patch(s.id, (p) => p.dec({ stock: s.qty }));
    await t.commit();
    return { saved: true };
  } catch (e) {
    if (isConflict(e)) return status === "paid" ? healIfMisflagged(client, doc._id, adjust) : { saved: true, duplicate: true };
    // e.g. a product was deleted since checkout: still record the order, flag stock for manual review.
    console.error("[orders] stock adjustment failed, saving order without it", reference, e?.message);
    try {
      await client.create({ ...doc, stockAdjusted: false });
      return { saved: true, stockAdjusted: false };
    } catch (e2) {
      if (isConflict(e2)) return { saved: true, duplicate: true };
      throw e2;
    }
  }
}

/**
 * An order that was flagged "needs_review" but now verifies cleanly (v2.4 compared
 * Paystack's string amounts strictly, so every payment looked mismatched) is
 * promoted to "paid" and its stock deducted — once, guarded by the revision.
 */
async function healIfMisflagged(client, id, adjust) {
  const existing = await client.fetch(`*[_id == $id][0]{status, _rev}`, { id });
  if (existing?.status !== "needs_review") return { saved: true, duplicate: true };
  try {
    const patches = await stockPatches(client, adjust);
    const t = client
      .transaction()
      .patch(id, (p) => p.ifRevisionId(existing._rev).set({ status: "paid", stockAdjusted: adjust.length > 0 }));
    for (const s of patches) t.patch(s.id, (p) => p.dec({ stock: s.qty }));
    await t.commit();
    return { saved: true, healed: true };
  } catch (e) {
    // Another request healed it first (revision changed) — treat as already done.
    console.error("[orders] heal skipped", id, e?.message);
    return { saved: true, duplicate: true };
  }
}

/* --------------------------------------------------------------- confirmation */

// When nothing could be recorded there's nothing to deduplicate on, so only the
// webhook (which Paystack sends once we answer 200) triggers the alerts.
const isFirst = (rec, source) =>
  (rec?.saved && !rec.duplicate) ||
  (["no-sanity-token", "record-failed"].includes(rec?.reason) && source === "webhook");

/** Human explanation for the usual Sanity write failures. */
export function explainSanityError(e) {
  const code = e?.statusCode ?? e?.response?.statusCode;
  if (code === 401) return "SANITY_API_READ_WRITE_TOKEN is missing, mistyped or revoked. Create a new Editor token.";
  if (code === 403) return "SANITY_API_READ_WRITE_TOKEN can't write. Create a token with Editor permissions.";
  return e?.message || String(e);
}

/** Human explanation for Paystack failures. */
export function explainPaystackError(e) {
  if (e?.status === 401) return "Paystack rejected PAYSTACK_SECRET_KEY (wrong key, or a test/live mix-up).";
  if (/not configured/i.test(String(e?.message))) return "PAYSTACK_SECRET_KEY is not set in .env.local.";
  if (e?.name === "TimeoutError" || /timed? ?out|fetch failed/i.test(String(e?.message)))
    return "Couldn't reach Paystack (network/timeout).";
  return e?.message || String(e);
}

/**
 * Verify a payment with Paystack and record it. Used by the confirmation page,
 * the webhook and the tracking page (which self-heals a missed webhook).
 * @returns {Promise<{status: "paid"|"pending"|"failed"|"mismatch"|"not_found", summary?: object, tx?: object, meta?: object}>}
 */
export async function confirmPayment(reference, { source = "page" } = {}) {
  let tx;
  try {
    tx = await paystack("transaction/verify/" + encodeURIComponent(reference));
  } catch (e) {
    // Paystack answers an unknown reference with 400/404 ("Transaction reference not found").
    if (e?.status === 400 || e?.status === 404 || /not found/i.test(String(e?.message))) return { status: "not_found" };
    throw e;
  }

  if (tx.status !== "success")
    return { status: ["failed", "abandoned", "reversed"].includes(tx.status) ? "failed" : "pending" };

  const meta = readMetadata(tx);
  if (!meta) return { status: "not_found" }; // not a storefront transaction

  if (tx.reference !== reference || tx.currency !== "GHS" || Number(tx.amount) !== meta.order.totalMinor) {
    console.error("[orders] payment mismatch", reference, { paid: tx.amount, expected: meta.order.totalMinor });
    const rec = await recordOrder(reference, tx, meta, "needs_review").catch((e) => {
      console.error(`[orders] ${reference} needs review but could not be saved: ${explainSanityError(e)}`);
      return { saved: false, reason: "record-failed" };
    });
    if (isFirst(rec, source))
      schedule(() => notifyPaymentMismatch({ reference, paidMinor: tx.amount, expectedMinor: meta.order.totalMinor }));
    return { status: "mismatch" };
  }

  // Paystack has confirmed the money — the customer must see "paid" even if
  // saving to Sanity fails. The failure is logged loudly for you to fix.
  let rec;
  try {
    rec = await recordOrder(reference, tx, meta, "paid");
  } catch (e) {
    console.error(`\n[orders] ✖ ${reference} is PAID but could not be saved to Sanity: ${explainSanityError(e)}\n`);
    rec = { saved: false, reason: "record-failed" };
  }
  // Alerts go out exactly once: when this call created the order. Without a Sanity
  // token there is no record to deduplicate on, so only the webhook sends them.
  if (isFirst(rec, source)) schedule(() => notifyPaidOrder(orderView(reference, tx, meta)));
  return { status: "paid", summary: summaryFromMeta(meta), tx, meta };
}

/* ------------------------------------------------------------------- tracking */

/**
 * Look up an order for the tracking page. The email must match the one used at
 * checkout; otherwise it behaves exactly like "not found" (no existence leak).
 */
export async function findOrderForTracking(reference, email) {
  const wanted = String(email || "").trim().toLowerCase();
  const client = getWriteClient();

  if (client) {
    const order = await client
      .fetch(
      `*[_id == $id][0]{reference, status, "email": customer.email, delivery{method, label}, items[]{name, qty}, total, totalMinor, paidAt, "updatedAt": _updatedAt, trackingNote}`,
      { id: orderDocId(reference) },
      )
      .catch((e) => {
        console.error(`[track] Sanity lookup failed, falling back to Paystack: ${explainSanityError(e)}`);
        return null;
      });
    if (order) {
      if (order.email !== wanted) return null;
      return {
        reference: order.reference,
        status: order.status,
        shipping: order.delivery?.method,
        shippingLabel: order.delivery?.label,
        items: order.items || [],
        totalMinor: order.totalMinor ?? Math.round(order.total * 100),
        paidAt: order.paidAt,
        updatedAt: order.updatedAt,
        note: order.trackingNote || null,
      };
    }
  }

  // Not in Sanity yet (no token, or the webhook hasn't landed): ask Paystack, and record it if paid.
  const result = await confirmPayment(reference);
  if (result.status !== "paid") return null;
  if (String(result.tx.customer?.email || "").toLowerCase() !== wanted) return null;
  return {
    reference,
    status: "paid",
    shipping: result.summary.shipping,
    shippingLabel: result.summary.shippingLabel,
    items: result.summary.items,
    totalMinor: result.summary.totalMinor,
    paidAt: result.tx.paid_at || null,
    updatedAt: result.tx.paid_at || null,
    note: null,
  };
}
