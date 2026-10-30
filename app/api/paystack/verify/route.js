import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "../../../../lib/rate-limit";
import { confirmPayment, explainPaystackError } from "../../../../lib/orders";
import { isValidReference } from "../../../../lib/validate";

export async function GET(request) {
  if (!rateLimit("verify:" + clientIp(request), { limit: 40, windowMs: 60_000 }))
    return NextResponse.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
  const reference = new URL(request.url).searchParams.get("reference");
  if (!isValidReference(reference)) return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
  try {
    const result = await confirmPayment(reference);
    if (result.status === "not_found") return NextResponse.json({ status: "not_found", reference }, { status: 404 });
    return NextResponse.json({
      status: result.status,
      reference,
      ...(result.status === "paid" ? { summary: result.summary } : {}),
    });
  } catch (e) {
    const detail = explainPaystackError(e);
    console.error(`\n[verify] ✖ ${reference}: ${detail}\n`, e);
    return NextResponse.json(
      // The reason is shown on the page in development only.
      { error: "Verification unavailable", ...(process.env.NODE_ENV !== "production" ? { detail } : {}) },
      { status: 500 },
    );
  }
}
