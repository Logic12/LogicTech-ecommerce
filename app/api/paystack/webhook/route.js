import { NextResponse } from "next/server";
import { verifySignature } from "../../../../lib/paystack";
import { confirmPayment } from "../../../../lib/orders";
import { isValidReference } from "../../../../lib/validate";

export async function POST(request) {
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("x-paystack-signature")))
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  try {
    const event = JSON.parse(raw);
    if (event.event !== "charge.success") return NextResponse.json({ ok: true });

    const reference = event.data?.reference;
    // Payments from other sites on the same Paystack account aren't ours: acknowledge
    // them with 200 so Paystack doesn't keep retrying.
    if (!isValidReference(reference) || !reference.startsWith("LTR-"))
      return NextResponse.json({ ok: true, ignored: true });

    // confirmPayment re-verifies with Paystack and is idempotent.
    const result = await confirmPayment(reference, { source: "webhook" });
    // Acknowledge mismatches (flagged for review) so Paystack stops retrying;
    // only transient failures below return 5xx to trigger a retry.
    return NextResponse.json({ ok: true, status: result.status });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
