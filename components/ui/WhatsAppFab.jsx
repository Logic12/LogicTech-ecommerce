"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { whatsappLink } from "@/lib/contact";

/** Floating “Chat with us” button. Steps aside while the bag drawer is open and on checkout. */
export function WhatsAppFab({ number, message }) {
  const { drawerOpen } = useCart();
  const pathname = usePathname();
  const [shown, setShown] = useState(false);
  const href = whatsappLink(number, message);

  useEffect(() => {
    const t = setTimeout(() => setShown(true), 900);
    return () => clearTimeout(t);
  }, []);

  if (!href) return null;
  const hidden = !shown || drawerOpen || pathname === "/checkout";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`wa-fab ${hidden ? "is-hidden" : ""}`}
      aria-label="Chat with us on WhatsApp"
      tabIndex={hidden ? -1 : undefined}
    >
      <span className="wa-fab__icon" aria-hidden="true">
        <MessageCircle size={22} strokeWidth={1.8} />
      </span>
      <span className="wa-fab__label">Chat with us</span>
    </a>
  );
}
