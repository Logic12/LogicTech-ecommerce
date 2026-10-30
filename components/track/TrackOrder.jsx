"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Check, CircleAlert, Copy, LoaderCircle, MessageCircle, MessageSquareText, Package, RotateCcw, Search, X,
} from "lucide-react";
import { moneyMinor } from "@/lib/format";
import { whatsappLink } from "@/lib/contact";
import { BRAND } from "@/lib/brand";
import { LAST_ORDER_KEY, stepIndex, trackingSteps } from "@/lib/order-status";

const dateFmt = new Intl.DateTimeFormat("en-GH", { day: "numeric", month: "short", year: "numeric" });
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function relative(iso) {
  if (!iso) return "";
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const units = [["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unit, secs] of units) if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  return "just now";
}

function readLast() {
  try {
    return JSON.parse(localStorage.getItem(LAST_ORDER_KEY)) || null;
  } catch {
    return null;
  }
}

export function TrackOrder({ initialRef = "", whatsapp }) {
  const [reference, setReference] = useState(initialRef.toUpperCase());
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | loading | found | error
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const resultRef = useRef(null);

  async function lookup(ref = reference, mail = email, { scroll = true } = {}) {
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: ref, email: mail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setOrder(data.order);
      setState("found");
      try {
        localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ ref: data.order.reference, email: mail.trim() }));
      } catch {}
      if (scroll && window.matchMedia("(max-width: 900px)").matches)
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (e) {
      setOrder(null);
      setError(e.message);
      setState("error");
    }
  }

  // Prefill from the last order on this device; auto-check when it matches the link.
  useEffect(() => {
    const last = readLast();
    if (!last?.email) return;
    const ref = initialRef ? initialRef.toUpperCase() : last.ref;
    setReference(ref);
    setEmail(last.email);
    if (ref === last.ref) lookup(ref, last.email, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steps = order ? trackingSteps(order.shipping) : [];
  const current = order ? stepIndex(order.status) : -1;
  const progress = current <= 0 ? 0 : current / (steps.length - 1);

  return (
    <div className="container page track">
      <div className="page-head">
        <div>
          <div className="eyebrow">Order tracking</div>
          <h1 className="display">
            Track your <em>order.</em>
          </h1>
          <p>Enter the reference from your confirmation and the email address you paid with.</p>
        </div>
      </div>

      <div className="track__layout">
        <form
          className="track__form"
          onSubmit={(e) => {
            e.preventDefault();
            lookup();
          }}
        >
          <div className="field">
            <label htmlFor="tr-ref">Order reference</label>
            <input
              id="tr-ref"
              className="track__ref-input"
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              placeholder="LTR-XXXXXXXX"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={64}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="tr-email">Email address</label>
            <input
              id="tr-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          {state === "error" && (
            <p className="form-error" role="alert">
              <CircleAlert size={16} /> {error}
            </p>
          )}
          <button className="btn btn--dark btn--block" disabled={state === "loading"}>
            {state === "loading" ? (
              <>
                <span>Checking…</span> <LoaderCircle size={17} className="spin" />
              </>
            ) : (
              <>
                <span>Track order</span> <Search size={17} />
              </>
            )}
          </button>
          <p className="fine-print">Your reference starts with “LTR-” and is on your confirmation page and Paystack receipt.</p>
        </form>

        <section ref={resultRef} className={`track__result ${state === "loading" && order ? "is-refreshing" : ""}`} aria-live="polite">
          {!order ? (
            <div className="track__placeholder">
              <span className="track__placeholder-icon">
                <Package size={26} strokeWidth={1.6} />
              </span>
              <strong>Your order status will appear here.</strong>
              <span>We’ll show every step, from payment to your door.</span>
            </div>
          ) : (
            <div className="track__card" key={order.reference + order.status}>
              <div className="track__head">
                <div>
                  <span className="eyebrow">Order</span>
                  <button
                    type="button"
                    className="track__ref"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(order.reference);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      } catch {}
                    }}
                    aria-label="Copy order reference"
                  >
                    {order.reference} {copied ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                  <span className="track__meta">
                    {order.paidAt ? `Placed ${dateFmt.format(new Date(order.paidAt))}` : "Placed"} · {order.shippingLabel}
                  </span>
                </div>
                <span className={`status-chip status-chip--${order.status}`}>
                  {order.status === "cancelled"
                    ? "Cancelled"
                    : order.status === "needs_review"
                      ? "Under review"
                      : steps[Math.max(current, 0)]?.label}
                </span>
              </div>

              {order.status === "cancelled" ? (
                <div className="track__banner track__banner--danger">
                  <X size={18} />
                  <p>This order was cancelled. If you have any questions about it, please contact us with your reference.</p>
                </div>
              ) : order.status === "needs_review" ? (
                <div className="track__banner">
                  <CircleAlert size={18} />
                  <p>We’re reviewing the payment for this order and will be in touch shortly.</p>
                </div>
              ) : (
                <ol className="timeline" style={{ "--progress": progress, "--steps": steps.length }}>
                  {steps.map((s, i) => (
                    <li
                      key={s.key}
                      className={`timeline__step ${i < current ? "is-done" : ""} ${i === current ? "is-current" : ""}`}
                      style={{ "--i": i }}
                      aria-current={i === current ? "step" : undefined}
                    >
                      <span className="timeline__dot" aria-hidden="true">
                        {i <= current && <Check size={13} strokeWidth={3} />}
                      </span>
                      <span className="timeline__copy">
                        <strong>{s.label}</strong>
                        <small>{i === 0 && order.paidAt ? dateFmt.format(new Date(order.paidAt)) : s.detail}</small>
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              {order.note && (
                <div className="track__note">
                  <MessageSquareText size={18} />
                  <div>
                    <span className="eyebrow">A note from us</span>
                    <p>{order.note}</p>
                  </div>
                </div>
              )}

              <ul className="track__items">
                {order.items.map((i, k) => (
                  <li key={k}>
                    <span>{i.name}</span>
                    <span>× {i.qty}</span>
                  </li>
                ))}
                <li className="track__total">
                  <span>Total paid</span>
                  <strong>{moneyMinor(order.totalMinor)}</strong>
                </li>
              </ul>

              {whatsapp && (
                <a
                  className="wa-link track__help"
                  href={whatsappLink(whatsapp, `Hi ${BRAND.name}, a question about order ${order.reference}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={17} strokeWidth={1.8} /> <span>Questions about this order? Chat with us</span>
                </a>
              )}

              <div className="track__foot">
                <span>Updated {relative(order.updatedAt)}</span>
                <div>
                  <button type="button" className="text-btn" onClick={() => lookup(order.reference, email, { scroll: false })}>
                    <RotateCcw size={14} /> Refresh
                  </button>
                  <Link href="/shop" className="link-arrow">
                    Continue shopping <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
