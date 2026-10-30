import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/contact";

/** Inline “ask on WhatsApp” link with a pre-filled message. */
export function WhatsAppLink({ number, message, children, className = "" }) {
  const href = whatsappLink(number, message);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`wa-link ${className}`}>
      <MessageCircle size={17} strokeWidth={1.8} /> <span>{children}</span>
    </a>
  );
}
