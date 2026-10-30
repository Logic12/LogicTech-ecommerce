// Store styles load with the store shell (not the root layout) so /studio stays unaffected.
import "@/app/globals.scss";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Toaster } from "@/components/ui/Toaster";
import { WhatsAppFab } from "@/components/ui/WhatsAppFab";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CATEGORIES } from "@/lib/categories";
import { getSiteSettings } from "@/lib/settings";
import { BRAND } from "@/lib/brand";

/** Everything around a storefront page: cart state, header, drawer, toasts, footer, chat. */
export async function StoreShell({ children }) {
  const settings = await getSiteSettings();
  return (
    <CartProvider>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header categories={CATEGORIES} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer settings={settings} />
      <CartDrawer />
      <Toaster />
      <WhatsAppFab number={settings.whatsappNumbers[0]} message={`Hi ${BRAND.name}, I have a question.`} />
    </CartProvider>
  );
}
