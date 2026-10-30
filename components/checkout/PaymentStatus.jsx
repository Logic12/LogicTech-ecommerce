"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CircleAlert, Clock, Copy, Check, Package, RotateCcw, X } from "lucide-react";
import { LAST_ORDER_KEY } from "@/lib/order-status";
import { useCart } from "@/components/cart/CartProvider";
import { moneyMinor } from "@/lib/format";

const MAX_POLLS = 6;
const POLL_MS = 2500;

const COPY = {
  checking: { eyebrow: "Payment status", title: ["Verifying your", "payment…"], text: "This usually takes a few seconds. Please keep this page open." },
  paid: { eyebrow: "Order confirmed", title: ["Payment", "confirmed."], text: "Thank you for shopping with LogicTech ReSale. Keep your order reference — you can use it to track your order at any time." },
  pending: { eyebrow: "Payment status", title: ["Not confirmed", "yet."], text: "If you completed the payment, it may take a moment to reach us. Don’t pay again — check again shortly or contact us with your reference." },
  failed: { eyebrow: "Payment not completed", title: ["Payment", "unsuccessful."], text: "Your payment was cancelled or declined and you have not been charged. Your bag is saved — you can try again." },
  error: { eyebrow: "Payment status", title: ["We couldn’t", "verify this."], text: "Please contact us with your reference before trying again, so we can check it for you." },
};

function StatusIcon({ state }) {
  if (state === "checking") return <span className="status-icon status-icon--spin" aria-hidden="true" />;
  if (state === "paid")
    return (
      <span className="status-icon status-icon--ok" aria-hidden="true">
        <svg viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="24" />
          <path d="M15 27l7 7 15-16" />
        </svg>
      </span>
    );
  const Icon = state === "pending" ? Clock : state === "failed" ? X : CircleAlert;
  return (
    <span className={`status-icon status-icon--${state}`} aria-hidden="true">
      <Icon size={26} />
    </span>
  );
}

export function PaymentStatus() {
  const reference = useSearchParams().get("reference");
  const { clear, removeIds } = useCart();
  const [state, setState] = useState(reference ? "checking" : "error");
  const [summary, setSummary] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [copied, setCopied] = useState(false);
  const [detail, setDetail] = useState("");
  const cleared = useRef(false);

  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    let timer;
    async function check(n) {
      try {
        const res = await fetch("/api/paystack/verify?reference=" + encodeURIComponent(reference), { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (data.status === "paid") {
          setSummary(data.summary || null);
          setState("paid");
          if (!cleared.current) {
            cleared.current = true;
            // Remove only what was paid for — reopening an old confirmation link
            // must not wipe a bag the customer has filled since.
            const paidIds = (data.summary?.items || []).map((i) => i.id).filter(Boolean);
            paidIds.length ? removeIds(paidIds) : clear();
            try {
              const draft = JSON.parse(sessionStorage.getItem("lt_checkout_draft") || "null");
              if (draft?.form?.email)
                localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ ref: reference, email: draft.form.email.trim() }));
              sessionStorage.removeItem("lt_checkout_draft");
            } catch {}
          }
        } else if (data.status === "failed") setState("failed");
        else if (!res.ok || data.status === "mismatch" || data.status === "not_found") {
          setDetail(data.detail || (data.status === "not_found" ? "Paystack has no transaction with this reference." : ""));
          setState("error");
        }
        else if (n + 1 < MAX_POLLS) timer = setTimeout(() => check(n + 1), POLL_MS);
        else setState("pending");
      } catch {
        // Network blip (common on mobile data): keep trying before giving up.
        if (cancelled) return;
        if (n + 1 < MAX_POLLS) timer = setTimeout(() => check(n + 1), POLL_MS);
        else {
          setDetail("");
          setState("error");
        }
      }
    }
    setState("checking");
    check(0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, attempt]);

  const c = COPY[state];

  return (
    <div className={`container page state-page payment payment--${state}`}>
      <ol className="steps" aria-label="Checkout progress">
        <li className="is-done">Bag</li>
        <li className="is-done">Details</li>
        <li className={state === "paid" ? "is-done" : "is-active"} aria-current="step">
          Payment
        </li>
      </ol>

      <StatusIcon state={state} />
      <div className="eyebrow">{c.eyebrow}</div>
      <h1 className="display" aria-live="polite">
        {c.title[0]} <em>{c.title[1]}</em>
      </h1>
      <p>{c.text}</p>

      {state === "paid" && summary && (
        <div className="receipt">
          <ul>
            {summary.items.map((i, k) => (
              <li key={i.id || `${i.name}-${k}`}>
                <span>{i.name}</span>
                <span>× {i.qty}</span>
              </li>
            ))}
          </ul>
          <div className="receipt__total">
            <span>Total paid</span>
            <strong>{moneyMinor(summary.totalMinor)}</strong>
          </div>
        </div>
      )}

      {state === "error" && detail && process.env.NODE_ENV !== "production" && (
        <p className="dev-detail" role="note">
          <strong>Developer detail:</strong> {detail}
        </p>
      )}

      {reference && (
        <button
          type="button"
          className="reference"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(reference);
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            } catch {}
          }}
        >
          <span>Reference</span>
          <code>{reference}</code>
          {copied ? <Check size={15} /> : <Copy size={15} />}
          <span className="visually-hidden">{copied ? "Copied" : "Copy reference"}</span>
        </button>
      )}

      <div className="state-page__actions">
        {state === "failed" && (
          <Link className="btn btn--dark" href="/checkout">
            <span>Try again</span> <RotateCcw size={16} />
          </Link>
        )}
        {(state === "pending" || state === "error") && reference && (
          <button type="button" className="btn btn--dark" onClick={() => setAttempt((a) => a + 1)}>
            <span>Check again</span> <RotateCcw size={16} />
          </button>
        )}
        {state === "paid" && (
          <Link className="btn btn--dark" href={`/track?ref=${encodeURIComponent(reference)}`}>
            <span>Track your order</span> <Package size={17} />
          </Link>
        )}
        {state !== "checking" && (
          <Link className="btn btn--ghost" href="/shop">
            <span>{state === "paid" ? "Continue shopping" : "Back to shop"}</span> <ArrowRight size={17} />
          </Link>
        )}
      </div>
    </div>
  );
}
