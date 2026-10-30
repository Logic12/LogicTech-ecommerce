import { TrackOrder } from "@/components/track/TrackOrder";
import { getSiteSettings } from "@/lib/settings";

export const metadata = {
  title: "Track your order",
  description: "Check the status of your LogicTech ReSale order.",
  robots: { index: false },
};

export default async function Page({ searchParams }) {
  const [{ ref }, settings] = await Promise.all([searchParams, getSiteSettings()]);
  return <TrackOrder initialRef={typeof ref === "string" ? ref.slice(0, 64) : ""} whatsapp={settings.whatsappNumbers[0]} />;
}
