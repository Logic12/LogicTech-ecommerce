import crypto from "node:crypto";

export function verifySignature(body, signature) {
  if (!process.env.PAYSTACK_SECRET_KEY || !signature) return false;
  const digest = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(body)
    .digest("hex");
  return (
    signature.length === digest.length &&
    crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
  );
}

export async function paystack(path, options = {}) {
  if (!process.env.PAYSTACK_SECRET_KEY) throw new Error("PAYSTACK_SECRET_KEY not configured");
  const response = await fetch("https://api.paystack.co/" + path, {
    ...options,
    headers: {
      Authorization: "Bearer " + process.env.PAYSTACK_SECRET_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.status)
    throw Object.assign(new Error(json.message || "Payment provider error"), { status: response.status });
  return json.data;
}
