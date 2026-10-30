"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock, RotateCcw, ShieldCheck, Trash2, Truck } from "lucide-react";
import { useCart } from "./CartProvider";
import { Img } from "@/components/ui/Img";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { money } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";
import { MAX_QTY_PER_LINE } from "@/lib/pricing";

export function CartView({ warrantyMonths = 3, returnDays = 7 }) {
  const { items, hydrated, remove, update, subtotal, count } = useCart();

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <div className="eyebrow">YOUR SELECTION</div>
          <h1 className="display">
            Shopping bag<span className="accent">.</span>
          </h1>
        </div>
        {hydrated && count > 0 && (
          <span className="page-head__meta">
            {count} item{count === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {!hydrated ? (
        <div className="cart-layout" aria-busy="true">
          <div>
            {[0, 1].map((k) => (
              <div key={k} className="skeleton skeleton--row" />
            ))}
          </div>
          <div className="skeleton skeleton--panel" />
        </div>
      ) : !items.length ? (
        <div className="empty">
          <h2>
            Your bag is <em>waiting.</em>
          </h2>
          <p>Explore thoughtfully selected technology.</p>
          <Link className="btn btn--dark" href="/shop">
            <span>Explore the collection</span> <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <ul className="cart-list">
            {items.map((i) => (
              <li className="cart-row" key={i.id}>
                <Link href={`/product/${i.id}`} className="cart-row__media">
                  <Img src={i.image} alt={i.name} fill sizes="(max-width: 600px) 96px, 140px" />
                </Link>
                <div className="cart-row__body">
                  <span className="eyebrow">
                    {[categoryLabel(i.category), i.conditionLabel].filter(Boolean).join(" · ")}
                  </span>
                  <Link href={`/product/${i.id}`}>
                    <h3>{i.name}</h3>
                  </Link>
                  <span className="cart-row__unit">{money(i.price)} each</span>
                  <QtyStepper
                    value={i.qty}
                    max={Math.min(i.stock ?? MAX_QTY_PER_LINE, MAX_QTY_PER_LINE)}
                    onChange={(q) => update(i.id, q)}
                  />
                </div>
                <div className="cart-row__side">
                  <strong>{money(i.price * i.qty)}</strong>
                  <button type="button" className="text-btn" onClick={() => remove(i.id)}>
                    <Trash2 size={15} /> Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <aside className="summary">
            <h2>Order summary</h2>
            <div className="summary__line">
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <div className="summary__line">
              <span>Delivery</span>
              <span>Calculated at checkout</span>
            </div>
            <Link href="/checkout" className="btn btn--dark btn--block">
              <span>Secure checkout</span> <Lock size={16} />
            </Link>
            <ul className="assurance assurance--compact">
              <li>
                <ShieldCheck size={16} /> {warrantyMonths}-month warranty on every device
              </li>
              <li>
                <RotateCcw size={16} /> {returnDays}-day returns
              </li>
              <li>
                <Truck size={16} /> Delivery across Ghana
              </li>
            </ul>
            <Link href="/shop" className="text-btn">
              <ArrowLeft size={15} /> Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
