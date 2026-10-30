import { CartView } from "@/components/cart/CartView";
import { getSiteSettings } from "@/lib/settings";

export const metadata = { title: "Shopping bag", robots: { index: false } };

export default async function Page() {
  const { warrantyMonths, returnDays } = await getSiteSettings();
  return <CartView warrantyMonths={warrantyMonths} returnDays={returnDays} />;
}
