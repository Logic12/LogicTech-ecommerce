// Paid-order alerts (owner: email + WhatsApp) and the customer receipt.
// Server-only. Every channel is optional and failures never affect the payment.
import { BRAND } from "./brand";
import { moneyMinor } from "./format";
import { displayPhone, toIntl, whatsappLink } from "./contact";
import { getSiteSettings } from "./settings";
import { siteUrl } from "./site";

const site = siteUrl;
const ownerEmail = () => process.env.ORDER_ALERT_EMAIL || "";

const withTimeout = (promise, ms = 10_000) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("timed out")), ms))]);

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* ------------------------------------------------------------------ channels */

/** "233558793259:KEY1,233243735752:KEY2" → [{ phone, key }] */
export function parseRecipients(value) {
  return String(value || "")
    .split(",")
    .map((pair) => pair.trim().split(":").map((x) => x.trim()))
    .filter(([phone, key]) => phone && key)
    .map(([phone, key]) => ({ phone: toIntl(phone), key }));
}

async function sendWhatsApp(text) {
  const recipients = parseRecipients(process.env.CALLMEBOT_RECIPIENTS);
  const results = await Promise.allSettled(
    recipients.map(async ({ phone, key }) => {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(key)}`;
      const res = await withTimeout(fetch(url, { cache: "no-store" }));
      if (!res.ok) throw new Error(`CallMeBot ${res.status} for ${phone}`);
    }),
  );
  results.filter((r) => r.status === "rejected").forEach((r) => console.error("[notify:whatsapp]", r.reason?.message));
}

async function sendEmail({ to, subject, html, text, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  const from = process.env.EMAIL_FROM || `${BRAND.name} <onboarding@resend.dev>`;
  const res = await withTimeout(
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    }),
  );
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

/** Customer receipts need a verified sending domain (Resend's test domain only reaches the account owner). */
export const canEmailCustomers = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && !/resend\.dev/i.test(process.env.EMAIL_FROM));

/* ------------------------------------------------------------------ messages */

const itemLines = (o) => o.lines.map((l) => `${l.qty}× ${l.name}`).join("\n");

function ownerText(o) {
  return [
    `🛍️ New order ${o.reference} — ${moneyMinor(o.totalMinor)}`,
    itemLines(o),
    `Delivery: ${o.shippingLabel}`,
    `Customer: ${o.customer.name} · ${displayPhone(o.customer.phone)}`,
    o.customer.address ? `Address: ${o.customer.address}` : null,
    `Email: ${o.customer.email}`,
    site() ? `Manage: ${site()}/studio` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function shell(title, body) {
  return `<!doctype html><html><body style="margin:0;background:#f3f4f1;font-family:Helvetica,Arial,sans-serif;color:#15181a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#15191a;padding:22px 28px;color:#f3f5f2;font-size:18px;font-weight:800;letter-spacing:-0.5px">
LOGIC<span style="color:#9cbfae">TECH</span> <span style="font-family:Georgia,serif;font-style:italic;font-weight:400;color:#9cbfae">ReSale</span></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:22px;letter-spacing:-0.5px">${esc(title)}</h1>
${body}
</td></tr></table>
<p style="font-size:11px;color:#8a918e;margin:16px 0 0">${esc(BRAND.name)} · Payments secured by Paystack</p>
</td></tr></table></body></html>`;
}

function itemsTable(o) {
  const rows = o.lines
    .map(
      (l) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eceeea;font-size:14px">${esc(l.name)}</td>
<td style="padding:8px 0;border-bottom:1px solid #eceeea;font-size:14px;color:#717876;text-align:center">× ${l.qty}</td>
<td style="padding:8px 0;border-bottom:1px solid #eceeea;font-size:14px;text-align:right">${moneyMinor(l.unitMinor * l.qty)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
<tr><td style="padding:8px 0;font-size:13px;color:#717876">Delivery — ${esc(o.shippingLabel)}</td><td></td>
<td style="padding:8px 0;font-size:13px;text-align:right;color:#717876">${o.shippingMinor ? moneyMinor(o.shippingMinor) : "Free"}</td></tr>
<tr><td style="padding:10px 0;font-size:15px;font-weight:700">Total paid</td><td></td>
<td style="padding:10px 0;font-size:17px;font-weight:700;text-align:right">${moneyMinor(o.totalMinor)}</td></tr></table>`;
}

function ownerEmailHtml(o) {
  const c = o.customer;
  return shell(
    `New order ${o.reference}`,
    `${itemsTable(o)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;background:#f6f7f4;border-radius:12px">
<tr><td style="padding:16px 18px;font-size:14px;line-height:1.7">
<strong>${esc(c.name)}</strong><br>${esc(displayPhone(c.phone))} · ${esc(c.email)}<br>${c.address ? esc(c.address) : "Store pickup"}
</td></tr></table>
${site() ? `<p style="margin:22px 0 0"><a href="${site()}/studio" style="background:#15191a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-size:13px;font-weight:700">Open orders in Studio</a></p>` : ""}`,
  );
}

function customerEmailHtml(o, settings) {
  const track = `${site()}/track?ref=${encodeURIComponent(o.reference)}`;
  const wa = whatsappLink(settings.whatsappNumbers[0], `Hi ${BRAND.name}, a question about order ${o.reference}`);
  return shell(
    `Thank you, ${o.customer.name.split(" ")[0]}.`,
    `<p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#3b4143">Your payment is confirmed and your order is being prepared.
Your order reference is <strong style="font-family:Menlo,monospace">${esc(o.reference)}</strong>.</p>
${itemsTable(o)}
<p style="margin:24px 0"><a href="${track}" style="background:#15191a;color:#fff;text-decoration:none;padding:13px 22px;border-radius:999px;font-size:14px;font-weight:700">Track your order</a></p>
<p style="margin:0;font-size:13px;line-height:1.7;color:#717876">Every device comes with a ${settings.warrantyMonths}-month warranty, and you can return items within ${settings.returnDays} days of purchase.
${wa ? `Questions? <a href="${wa}" style="color:#557a69">Chat with us on WhatsApp</a>.` : ""}</p>`,
  );
}

/* ------------------------------------------------------------------ public API */

/** Alerts the owner (email + WhatsApp) and emails the customer a receipt. Never throws. */
export async function notifyPaidOrder(order) {
  const settings = await getSiteSettings().catch(() => null);
  const tasks = [
    sendWhatsApp(ownerText(order)),
    sendEmail({
      to: ownerEmail(),
      subject: `New order ${order.reference} — ${moneyMinor(order.totalMinor)}`,
      html: ownerEmailHtml(order),
      text: ownerText(order),
      replyTo: order.customer.email,
    }),
  ];
  if (canEmailCustomers() && settings)
    tasks.push(
      sendEmail({
        to: order.customer.email,
        subject: `Your ${BRAND.name} order ${order.reference}`,
        html: customerEmailHtml(order, settings),
        text: `Thank you! Your order ${order.reference} (${moneyMinor(order.totalMinor)}) is confirmed. Track it at ${site()}/track?ref=${order.reference}`,
        replyTo: settings.contactEmail || undefined,
      }),
    );
  const results = await Promise.allSettled(tasks);
  results.filter((r) => r.status === "rejected").forEach((r) => console.error("[notify]", r.reason?.message));
}

/** Owner-only alert when a payment doesn't match its order. */
export async function notifyPaymentMismatch({ reference, paidMinor, expectedMinor }) {
  const text = `⚠️ Payment needs review: ${reference}\nPaid ${moneyMinor(paidMinor)}, expected ${moneyMinor(expectedMinor)}.\nCheck it in Paystack before fulfilling.`;
  const results = await Promise.allSettled([
    sendWhatsApp(text),
    sendEmail({ to: ownerEmail(), subject: `⚠️ Payment needs review — ${reference}`, text, html: shell(`Payment needs review`, `<p style="font-size:15px;line-height:1.7;white-space:pre-line">${esc(text)}</p>`) }),
  ]);
  results.filter((r) => r.status === "rejected").forEach((r) => console.error("[notify]", r.reason?.message));
}
