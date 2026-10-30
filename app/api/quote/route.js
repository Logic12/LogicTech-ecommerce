import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "../../../lib/rate-limit";
import { getSettingsForPricing } from "../../../lib/settings";
import { getProductsForPricing } from "../../../lib/catalog";
import { priceCart } from "../../../lib/pricing";

/**
 * Returns server-authoritative prices, stock and totals for a cart, so the
 * checkout summary shows exactly what Paystack will charge. Writes nothing.
 */
export async function POST(request) {
  if (!rateLimit("quote:" + clientIp(request), { limit: 60, windowMs: 60_000 }))
    return NextResponse.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
  try {
    const { items, shipping = "standard" } = await request.json();
    const [catalog, settings] = await Promise.all([getProductsForPricing(), getSettingsForPricing()]);
    const quote = priceCart(items, catalog, shipping, settings.deliveryOptions);
    if (quote.error) return NextResponse.json({ error: quote.error }, { status: 400 });
    return NextResponse.json(quote);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unable to price your bag right now." }, { status: 503 });
  }
}
