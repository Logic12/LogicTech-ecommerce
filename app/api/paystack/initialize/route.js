import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "../../../../lib/rate-limit";
import { getSettingsForPricing } from "../../../../lib/settings";
import { getProductsForPricing } from "../../../../lib/catalog";
import { buildMetadata, createReference } from "../../../../lib/orders";
import { paystack } from "../../../../lib/paystack";
import { priceCart } from "../../../../lib/pricing";
import { validateCustomer } from "../../../../lib/validate";
import { siteUrl } from "../../../../lib/site";

export async function POST(request) {
  if (!rateLimit("init:" + clientIp(request), { limit: 12, windowMs: 60_000 }))
    return NextResponse.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { items, shipping = "standard", customer = {} } = body || {};
  const { value: contact, errors } = validateCustomer(customer, shipping);
  if (Object.keys(errors).length)
    return NextResponse.json({ error: "Please check your details.", fieldErrors: errors }, { status: 422 });

  try {
    const [catalog, settings] = await Promise.all([getProductsForPricing(), getSettingsForPricing()]);
    const quote = priceCart(items, catalog, shipping, settings.deliveryOptions);
    if (quote.error) return NextResponse.json({ error: quote.error }, { status: 400 });
    // Never charge for a cart that differs from what the customer reviewed.
    if (quote.issues.length || !quote.lines.length)
      return NextResponse.json(
        { error: "Your bag changed since you last looked. Please review it.", issues: quote.issues, quote },
        { status: 409 },
      );

    if (quote.totalMinor < 100)
      return NextResponse.json({ error: "This order total is too low to pay online." }, { status: 400 });

    const reference = createReference();
    const site = process.env.NEXT_PUBLIC_SITE_URL ? siteUrl() : new URL(request.url).origin;
    // Nothing is stored until Paystack confirms payment: the priced order travels
    // with the transaction as metadata and is recorded on confirmation.
    const payment = await paystack("transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email: contact.email,
        amount: quote.totalMinor,
        currency: "GHS",
        reference,
        callback_url: site + "/payment/verify?reference=" + encodeURIComponent(reference),
        metadata: buildMetadata({ quote, contact, shipping }),
      }),
    });

    return NextResponse.json({ authorization_url: payment.authorization_url, reference });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unable to start checkout. Please try again shortly." }, { status: 500 });
  }
}
