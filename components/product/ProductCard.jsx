"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { Img } from "@/components/ui/Img";
import { money, discountPercent } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";

export function ProductCard({ product, priority = false }) {
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const soldOut = product.stock < 1;
  const lowStock = !soldOut && product.stock <= 3;
  const off = discountPercent(product.price, product.originalPrice);
  const alt = product.gallery?.[1];

  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(false), 1600);
    return () => clearTimeout(t);
  }, [justAdded]);

  return (
    <article className={`card ${soldOut ? "is-sold-out" : ""}`}>
      <Link href={`/product/${product.id}`} className="card__media" aria-label={product.name}>
        <div className="card__badges">
          {product.badge && <span className="pill">{product.badge}</span>}
          {off > 0 && <span className="pill pill--accent">−{off}%</span>}
        </div>
        <Img
          src={product.image}
          lqip={product.lqip}
          alt={product.name}
          fill
          sizes="(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 25vw"
          className="card__img"
          priority={priority}
        />
        {alt && (
          <Img src={alt.url} lqip={alt.lqip} alt="" fill sizes="(max-width: 600px) 50vw, 25vw" className="card__img card__img--alt" />
        )}
        {soldOut && <span className="card__soldout">Sold out</span>}
      </Link>

      <div className="card__body">
        <div className="eyebrow card__eyebrow">
          {product.brand || categoryLabel(product.category)} · {product.conditionLabel || product.condition || "Premium"}
        </div>
        <Link href={`/product/${product.id}`} className="card__title">
          <h3>{product.name}</h3>
        </Link>
        <div className="card__foot">
          <div className="card__price">
            <strong>{money(product.price)}</strong>
            {product.originalPrice && <del>{money(product.originalPrice)}</del>}
            {lowStock && <span className="card__low">Only {product.stock} left</span>}
          </div>
          <button
            type="button"
            className={`add-btn ${justAdded ? "is-added" : ""}`}
            aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to bag`}
            onClick={() => add(product) && setJustAdded(true)}
            disabled={soldOut}
          >
            <Plus size={18} className="add-btn__plus" />
            <Check size={18} className="add-btn__check" />
          </button>
        </div>
      </div>
    </article>
  );
}
