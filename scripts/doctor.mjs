// Checks your configuration against the real services — sends nothing, changes nothing.
//
//   npm run doctor                 check keys and settings
//   npm run doctor -- LTR-XXXXXXXX also explain what happened to one payment
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/* ------------------------------------------------------------------ env files */
for (const file of [".env.local", ".env"]) {
  const path = join(root, file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    let v = m[2];
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    else v = v.replace(/\s+#.*$/, "");
    process.env[m[1]] = v;
  }
}
const env = (k) => (process.env[k] || "").trim();

/* ------------------------------------------------------------------- output */
let failures = 0;
const ok = (msg) => console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
const warn = (msg) => console.log(`  \x1b[33m!\x1b[0m ${msg}`);
const bad = (msg, fix) => {
  failures++;
  console.log(`  \x1b[31m✖\x1b[0m ${msg}${fix ? `\n      → ${fix}` : ""}`);
};
const section = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);

async function call(url, init = {}) {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15000) });
    let body = null;
    try {
      body = await res.json();
    } catch {}
    return { status: res.status, body };
  } catch (e) {
    return { status: 0, body: null, error: e.message };
  }
}

/* --------------------------------------------------------------------- site */
section("Site");
const site = env("NEXT_PUBLIC_SITE_URL");
if (!site) warn("NEXT_PUBLIC_SITE_URL not set — Paystack will return customers to whatever address the checkout ran on.");
else {
  ok(`Paystack sends customers back to ${site}/payment/verify`);
  if (/localhost|127\.0\.0\.1/.test(site))
    warn("That's localhost: testing on your phone? Use your computer's IP (e.g. http://192.168.100.11:3000) instead, or the phone can't load the confirmation page.");
}

/* ------------------------------------------------------------------ paystack */
section("Paystack");
const psKey = env("PAYSTACK_SECRET_KEY");
const PS = "https://api.paystack.co";
const psAuth = { headers: { Authorization: `Bearer ${psKey}` } };
if (!psKey) bad("PAYSTACK_SECRET_KEY is not set", "Copy the Secret Key from Paystack → Settings → API Keys & Webhooks.");
else if (!/^sk_(test|live)_/.test(psKey)) bad("PAYSTACK_SECRET_KEY doesn't look like a secret key", "It should start with sk_test_ or sk_live_ (not pk_).");
else {
  const mode = psKey.startsWith("sk_test_") ? "TEST" : "LIVE";
  const r = await call(`${PS}/transaction?perPage=1`, psAuth);
  if (r.status === 200) ok(`Secret key accepted (${mode} mode)`);
  else if (r.status === 401) bad("Paystack rejected the secret key", "Re-copy it from the Paystack dashboard; make sure there are no spaces or quotes.");
  else bad(`Couldn't reach Paystack (${r.status || r.error})`);
}

/* -------------------------------------------------------------------- sanity */
section("Sanity");
const pid = env("NEXT_PUBLIC_SANITY_PROJECT_ID");
const ds = env("NEXT_PUBLIC_SANITY_DATASET") || "production";
const token = env("SANITY_API_WRITE_TOKEN") || env("SANITY_API_READ_WRITE_TOKEN");
const SAN = pid ? `https://${pid}.api.sanity.io/v2025-01-01` : null;
if (!pid) warn("No Sanity project — the demo catalogue is used and orders live in Paystack only.");
else {
  const q = encodeURIComponent('count(*[_type == "product" && active != false])');
  const r = await call(`${SAN}/data/query/${ds}?query=${q}`);
  if (r.status === 200) {
    const n = r.body?.result ?? 0;
    n ? ok(`Dataset "${ds}" is readable — ${n} active product${n === 1 ? "" : "s"}`) : warn(`Dataset "${ds}" has no active products yet (the demo catalogue is shown in development).`);
  } else if (r.status === 404) bad(`Project "${pid}" or dataset "${ds}" not found`, "Check NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET.");
  else if (r.status === 401 || r.status === 403) warn(`Dataset "${ds}" is private — the storefront can't read products without a token.`);
  else bad(`Couldn't reach Sanity (${r.status || r.error})`);

  if (!token) bad("SANITY_API_READ_WRITE_TOKEN is not set", "Paid orders won't be saved and stock won't change. Create an Editor token at sanity.io/manage → API → Tokens.");
  else {
    // Dry run: validates the token can write without creating anything.
    const w = await call(`${SAN}/data/mutate/${ds}?dryRun=true`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ mutations: [{ createOrReplace: { _id: "doctor.check", _type: "doctorCheck" } }] }),
    });
    if (w.status === 200) ok("Token can write (orders will be saved, stock deducted)");
    else if (w.status === 401) bad("Sanity token is invalid or revoked", "This is the usual cause of failed payment verification. Create a new Editor token and update .env.local.");
    else if (w.status === 403) bad("Sanity token is read-only", "Create a token with Editor permissions and update .env.local.");
    else bad(`Sanity write check failed (${w.status || w.error})`, w.body?.error?.description || w.body?.message);
  }
}

/* -------------------------------------------------------------------- alerts */
section("Order alerts");
const reKey = env("RESEND_API_KEY");
if (!reKey) warn("RESEND_API_KEY not set — no email alerts.");
else {
  const r = await call("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${reKey}` } });
  const msg = JSON.stringify(r.body || "");
  if (r.status === 200) ok(`Resend key accepted (${(r.body?.data || []).length} domain(s))`);
  else if (/restricted/i.test(msg)) ok("Resend key accepted (sending-only key)");
  else if (r.status === 401 || r.status === 403 || r.status === 400) bad("Resend rejected the API key", "Create a new key in Resend → API keys and paste the full value.");
  else warn(`Couldn't check the Resend key (${r.status || r.error})`);
}
const alertTo = env("ORDER_ALERT_EMAIL");
alertTo ? ok(`Order alerts go to ${alertTo}`) : warn("ORDER_ALERT_EMAIL not set — no email alert to you.");
const from = env("EMAIL_FROM");
if (!from || /resend\.dev/i.test(from)) warn("Customer receipts are off until you verify a domain in Resend and set EMAIL_FROM.");
else ok(`Customer receipts send from ${from}`);
const cmb = env("CALLMEBOT_RECIPIENTS");
if (!cmb) warn("CALLMEBOT_RECIPIENTS not set — no WhatsApp alerts.");
else {
  const pairs = cmb.split(",").map((p) => p.trim()).filter(Boolean);
  const good = pairs.filter((p) => /^\+?\d[\d\s]{8,}:\S+$/.test(p));
  good.length === pairs.length
    ? ok(`WhatsApp alerts to ${good.length} number(s)`)
    : bad("CALLMEBOT_RECIPIENTS format is off", "Use number:key,number:key — e.g. 0558793259:123456,0243735752:654321");
}

/* ---------------------------------------------------------- one payment */
const ref = (process.argv[2] || "").trim().toUpperCase();
if (ref && psKey) {
  section(`Payment ${ref}`);
  const r = await call(`${PS}/transaction/verify/${encodeURIComponent(ref)}`, psAuth);
  if (r.status !== 200 || !r.body?.status) {
    bad("Paystack has no transaction with this reference", "Check the reference, and that PAYSTACK_SECRET_KEY is the same mode (test/live) you paid in.");
  } else {
    const tx = r.body.data;
    let meta = tx.metadata;
    if (typeof meta === "string") try { meta = JSON.parse(meta); } catch { meta = null; }
    const expected = Number(meta?.order?.totalMinor);
    tx.status === "success" ? ok(`Paystack status: success (${tx.channel || "?"})`) : bad(`Paystack status: ${tx.status}`, tx.gateway_response || "The payment didn't complete.");
    tx.currency === "GHS" ? ok("Currency: GHS") : bad(`Currency is ${tx.currency}, expected GHS`, "Your Paystack account must accept GHS.");
    if (!meta?.order) bad("No order details attached", "This transaction wasn't started by this storefront version (initialise a new checkout).");
    else if (Number(tx.amount) !== expected) bad(`Amount mismatch: paid ${tx.amount} pesewas, order total ${expected}`);
    else ok(`Amount matches the order (${(tx.amount / 100).toLocaleString("en-GH")} GHS)`);
    if (pid && token) {
      const q = encodeURIComponent(`*[_id == "order.${ref}"][0]{status, stockAdjusted}`);
      const o = await call(`${SAN}/data/query/${ds}?query=${q}`, { headers: { Authorization: `Bearer ${token}` } });
      if (o.body?.result?.status === "needs_review")
        warn(`Saved in Studio as "needs_review" — open its confirmation page once and it will be corrected to "paid" if the amounts match.`);
      else if (o.body?.result) ok(`Saved in Studio — status "${o.body.result.status}", stock deducted: ${o.body.result.stockAdjusted ? "yes" : "no"}`);
      else warn("Not saved in Sanity yet — open the confirmation or tracking page once the issues above are fixed.");
    }
  }
}

console.log(failures ? `\n\x1b[31m${failures} problem(s) found.\x1b[0m\n` : "\n\x1b[32mAll good.\x1b[0m\n");
process.exit(failures ? 1 : 0);
