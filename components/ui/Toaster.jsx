"use client";
import Image from "next/image";
import { Check, Info, X } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

export function Toaster() {
  const { toasts, dismissToast, openDrawer } = useCart();
  return (
    <div className="toaster" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tone === "muted" ? "toast--muted" : ""}`} role="status">
          <div className="toast__media">
            {t.image ? (
              <Image src={t.image} alt="" width={48} height={48} />
            ) : t.tone === "muted" ? (
              <Info size={18} />
            ) : (
              <Check size={18} />
            )}
          </div>
          <div className="toast__copy">
            <strong>{t.title}</strong>
            {t.description && <span>{t.description}</span>}
          </div>
          {t.action === "view-bag" && (
            <button
              type="button"
              className="toast__action"
              onClick={() => {
                dismissToast(t.id);
                openDrawer();
              }}
            >
              View bag
            </button>
          )}
          <button type="button" className="toast__close" onClick={() => dismissToast(t.id)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
