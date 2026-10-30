import { CheckoutView } from "@/components/checkout/CheckoutView";
import { getSiteSettings } from "@/lib/settings";

export const metadata = { title: "Checkout", robots: { index: false } };

export default async function Page() {
  const settings = await getSiteSettings();
  return <CheckoutView shippingOptions={settings.deliveryOptions} />;
}
