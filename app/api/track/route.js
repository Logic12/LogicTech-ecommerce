import { NextResponse } from "next/server";
import { findOrderForTracking, normalizeReference } from "../../../lib/orders";
import { clientIp, rateLimit } from "../../../lib/rate-limit";
import { isValidReference } from "../../../lib/validate";

const NOT_FOUND = "We couldn’t find an order with those details. Check the reference and the email you paid with.";

export async function POST(request) {
  if (!rateLimit("track:" + clientIp(request), { limit: 10, windowMs: 60_000 }))
    return NextResponse.json({ error: "Too many attempts. Please wait a minute and try again." }, { status: 429 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const reference = normalizeReference(body?.reference);
  const email = String(body?.email || "").trim();
  if (!isValidReference(reference) || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    return NextResponse.json({ error: "Enter your order reference and the email you paid with." }, { status: 400 });

  try {
    const order = await findOrderForTracking(reference, email);
    if (!order) return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    return NextResponse.json({ order });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Tracking is unavailable right now. Please try again shortly." }, { status: 503 });
  }
}
