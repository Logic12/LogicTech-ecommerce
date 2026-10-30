"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleAlert, Lock, LoaderCircle } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { Img } from "@/components/ui/Img";
import { money, moneyMinor } from "@/lib/format";
import { validateCustomer } from "@/lib/validate";

const DRAFT_KEY = "lt_checkout_draft";
const EMPTY = { name: "", email: "", phone: "", address: "" };

function Field({ id, label, error, children, className = "" }) {
  return (
    <div className={`field ${error ? "has-error" : ""} ${className}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p className="field__error" id={`${id}-error`}>
          <CircleAlert size={13} /> {error}
        </p>
      )}
    </div>
  );
}

export function CheckoutView({ shippingOptions }) {
  const { items, hydrated, syncFromQuote } = useCart();
  const [form, setForm] = useState(EMPTY);
  const [shipping, setShipping] = useState(() =>
    shippingOptions.some((s) => s.id === "standard") ? "standard" : shippingOptions[0]?.id || "standard",
  );
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [quote, setQuote] = useState(null);
  const [quoteState, setQuoteState] = useState("idle");
  const [notices, setNotices] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef(null);

  // Restore an in-progress draft (e.g. after returning from an abandoned payment).
  useEffect(() => {
    try {
      const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY));
      if (d?.form) setForm({ ...EMPTY, ...d.form });
      if (d?.shipping && shippingOptions.some((s) => s.id === d.shipping)) setShipping(d.shipping);
    } catch {}
  }, [shippingOptions]);
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, shipping }));
    } catch {}
  }, [form, shipping]);

  const itemsKey = useMemo(() => items.map((i) => `${i.id}:${i.qty}:${i.price}`).join("|"), [items]);

  // Server-authoritative quote: what the customer sees is what Paystack charges.
  useEffect(() => {
    if (!hydrated || !items.length) return;
    const ctrl = new AbortController();
    setQuoteState("loading");
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shipping, items: items.map(({ id, qty, price }) => ({ id, qty, price })) }),
          signal: ctrl.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to price your bag right now.");
        if (data.issues.length) {
          setNotices((n) => [...new Set([...n, ...data.issues.map((i) => i.message)])]);
          syncFromQuote(data.lines);
        }
        setQuote(data);
        setQuoteState("ready");
        setError("");
      } catch (e) {
        if (e.name === "AbortError") return;
        setQuoteState("error");
        setError(e.message);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, itemsKey, shipping]);

  const liveErrors = useMemo(() => validateCustomer(form, shipping).errors, [form, shipping]);
  const errorFor = (k) => fieldErrors[k] || (touched[k] ? liveErrors[k] : undefined);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [k]: undefined }));
  };
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));
  const inputProps = (k) => ({
    id: `co-${k}`,
    name: k,
    value: form[k],
    onChange: set(k),
    onBlur: blur(k),
    "aria-invalid": Boolean(errorFor(k)) || undefined,
    "aria-describedby": errorFor(k) ? `co-${k}-error` : undefined,
  });

  async function submit(e) {
    e.preventDefault();
    setError("");
    const { errors } = validateCustomer(form, shipping);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setTouched({ name: true, email: true, phone: true, address: true });
      formRef.current?.querySelector(`[name="${Object.keys(errors)[0]}"]`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipping, customer: form, items: items.map(({ id, qty }) => ({ id, qty })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 422) {
        setFieldErrors(data.fieldErrors || {});
        setBusy(false);
        return;
      }
      if (res.status === 409) {
        setNotices((n) => [...new Set([...n, ...(data.issues || []).map((i) => i.message)])]);
        if (data.quote?.lines) syncFromQuote(data.quote.lines);
        setBusy(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (!res.ok || !data.authorization_url) throw new Error(data.error || "Unable to start payment.");
      window.location.assign(data.authorization_url);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const lines = quote?.lines?.length ? quote.lines : null;
  const stale = quoteState !== "ready";

  return (
    <div className="container page">
      <ol className="steps" aria-label="Checkout progress">
        <li className="is-done">
          <Link href="/cart">Bag</Link>
        </li>
        <li className="is-active" aria-current="step">
          Details
        </li>
        <li>Payment</li>
      </ol>

      <div className="page-head">
        <div>
          <div className="eyebrow">Secure payment</div>
          <h1 className="display">
            Checkout<span className="accent">.</span>
          </h1>
        </div>
      </div>

      {notices.length > 0 && (
        <div className="notice" role="status">
          <CircleAlert size={18} />
          <div>
            <strong>We updated your bag</strong>
            <ul>
              {notices.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!hydrated ? (
        <div className="checkout-layout" aria-busy="true">
          <div className="skeleton skeleton--panel" />
          <div className="skeleton skeleton--panel" />
        </div>
      ) : !items.length ? (
        <div className="empty">
          <h2>
            Your bag is <em>empty.</em>
          </h2>
          <p>Add something you love, then come back to check out.</p>
          <Link href="/shop" className="btn btn--dark">
            <span>Browse products</span> <ArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <div className="checkout-layout">
          <form ref={formRef} className="checkout-form" onSubmit={submit} noValidate>
            <fieldset>
              <legend>
                <span>01</span> Contact
              </legend>
              <Field id="co-name" label="Full name" error={errorFor("name")}>
                <input {...inputProps("name")} autoComplete="name" required />
              </Field>
              <div className="field-row">
                <Field id="co-email" label="Email address" error={errorFor("email")}>
                  <input {...inputProps("email")} type="email" autoComplete="email" inputMode="email" required />
                </Field>
                <Field id="co-phone" label="Phone number" error={errorFor("phone")}>
                  <input {...inputProps("phone")} type="tel" autoComplete="tel" inputMode="tel" placeholder="024 000 0000" required />
                </Field>
              </div>
            </fieldset>

            <fieldset>
              <legend>
                <span>02</span> Delivery
              </legend>
              <div className="choice-grid" role="radiogroup" aria-label="Delivery method">
                {shippingOptions.map((o) => (
                  <label key={o.id} className={`choice ${shipping === o.id ? "is-selected" : ""}`}>
                    <input
                      type="radio"
                      name="shipping"
                      value={o.id}
                      checked={shipping === o.id}
                      onChange={() => setShipping(o.id)}
                    />
                    <span className="choice__radio" aria-hidden="true" />
                    <span className="choice__copy">
                      <strong>{o.label}</strong>
                      <small>{o.detail}</small>
                    </span>
                    <span className="choice__price">{o.fee ? money(o.fee) : "Free"}</span>
                  </label>
                ))}
              </div>
              <div className={`collapse ${shipping === "pickup" ? "" : "is-open"}`} inert={shipping === "pickup"}>
                <div>
                  <Field id="co-address" label="Delivery address" error={errorFor("address")}>
                    <textarea
                      {...inputProps("address")}
                      autoComplete="street-address"
                      rows={3}
                      placeholder="House number, street, area, city — plus a landmark or GPS address"
                    />
                  </Field>
                </div>
              </div>
            </fieldset>

            {error && (
              <p className="form-error" role="alert">
                <CircleAlert size={16} /> {error}
              </p>
            )}

            <button
              className="btn btn--dark btn--block btn--lg"
              disabled={busy || quoteState === "error" || !quote}
            >
              {busy ? (
                <>
                  <span>Connecting securely…</span> <LoaderCircle size={18} className="spin" />
                </>
              ) : (
                <>
                  <span>{quote ? `Pay ${moneyMinor(quote.totalMinor)}` : "Preparing your order…"}</span>{" "}
                  <Lock size={17} />
                </>
              )}
            </button>
            <p className="fine-print">
              You’ll be redirected to Paystack to complete your payment securely. We never see or store your card
              details. By paying you agree to our <Link href="/terms">terms</Link>,{" "}
              <Link href="/returns">returns</Link> and <Link href="/warranty">warranty</Link> policies.
            </p>
          </form>

          <aside className={`summary summary--sticky ${stale ? "is-stale" : ""}`} aria-live="polite">
            <h2>Your order</h2>
            <ul className="summary__items">
              {(lines || items).map((i) => (
                <li key={i.id}>
                  <span className="summary__thumb">
                    <Img src={i.image} alt="" fill sizes="64px" />
                    <span className="summary__qty">{i.qty}</span>
                  </span>
                  <span className="summary__name">{i.name}</span>
                  <strong>{lines ? moneyMinor(i.lineMinor) : money(i.price * i.qty)}</strong>
                </li>
              ))}
            </ul>
            <div className="summary__line">
              <span>Subtotal</span>
              <strong>{quote ? moneyMinor(quote.subtotalMinor) : "—"}</strong>
            </div>
            <div className="summary__line">
              <span>Delivery</span>
              <strong>{quote ? (quote.shippingMinor ? moneyMinor(quote.shippingMinor) : "Free") : "—"}</strong>
            </div>
            <div className="summary__line summary__line--total">
              <span>Total</span>
              <strong>{quote ? moneyMinor(quote.totalMinor) : "—"}</strong>
            </div>
            <p className="summary__secure">
              <Lock size={14} /> Prices and stock confirmed by our server.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
