import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { Reveal } from "@/components/ui/Reveal";

export function Catalog({ products, priorityCount = 0 }) {
  if (!products.length)
    return (
      <div className="catalog-empty">
        <strong>
          New arrivals are <em>on their way.</em>
        </strong>
        <p>Our latest devices are being prepared. Check back soon, or get in touch for availability.</p>
        <Link href="/shop" className="link-arrow">
          Browse the shop <ArrowUpRight size={16} />
        </Link>
      </div>
    );

  return (
    <div className="product-grid">
      {products.map((p, i) => (
        <Reveal key={p.id} delay={(i % 4) * 90}>
          <ProductCard product={p} priority={i < priorityCount} />
        </Reveal>
      ))}
    </div>
  );
}
