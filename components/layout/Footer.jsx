import Link from "next/link";
import { Lock, Mail, MessageCircle } from "lucide-react";
import { displayPhone, whatsappLink } from "@/lib/contact";
import { CATEGORIES } from "@/lib/categories";
import { BRAND } from "@/lib/brand";
import { Logo } from "@/components/ui/Logo";

export function Footer({ settings }) {
  const help = `Hi ${BRAND.name}, I have a question.`;
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <Logo variant="footer" />
          <p>
            Exceptional tech. <em>An elevated experience.</em>
          </p>
        </div>

        <div className="footer__col">
          <h2>Shop</h2>
          <Link href="/shop">All products</Link>
          {CATEGORIES.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.id}`}>
              {c.label}
            </Link>
          ))}
        </div>

        <div className="footer__col">
          <h2>Your order</h2>
          <Link href="/cart">Your bag</Link>
          <Link href="/checkout">Checkout</Link>
          <Link href="/track">Track an order</Link>
        </div>

        <div className="footer__col">
          <h2>Help</h2>
          <Link href="/delivery">Delivery</Link>
          <Link href="/warranty">{settings.warrantyMonths}-month warranty</Link>
          <Link href="/returns">{settings.returnDays}-day returns</Link>
        </div>

        <div className="footer__col footer__contact">
          <h2>Talk to us</h2>
          {settings.whatsappNumbers.map((n) => (
            <a key={n} href={whatsappLink(n, help)} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={15} /> {displayPhone(n)}
            </a>
          ))}
          {settings.contactEmail && (
            <a href={`mailto:${settings.contactEmail}`}>
              <Mail size={15} /> {settings.contactEmail}
            </a>
          )}
          <p>Availability, delivery or support — message us on WhatsApp.</p>
        </div>
      </div>

      <div className="footer__bottom">
        <small>
          © {new Date().getFullYear()} {BRAND.name}. Built for what’s next.
        </small>
        <nav className="footer__legal" aria-label="Legal">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
        <small className="footer__secure">
          <Lock size={13} /> Payments secured by Paystack
        </small>
      </div>

      <div className="footer__wordmark" aria-hidden="true">
        LOGICTECH<em>{BRAND.sub}</em>
      </div>
    </footer>
  );
}
