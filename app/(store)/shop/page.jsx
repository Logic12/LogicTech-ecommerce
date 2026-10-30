import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Catalog } from "@/components/product/Catalog";
import { ShopToolbar } from "@/components/shop/ShopToolbar";
import { getProducts, queryProducts, SORTS } from "@/lib/catalog";
import { CATEGORIES, CATEGORY_IDS, categoryLabel } from "@/lib/categories";
import { BRAND } from "@/lib/brand";

export async function generateMetadata({ searchParams }) {
  const { category } = await searchParams;
  return CATEGORY_IDS.includes(category)
    ? { title: categoryLabel(category), description: `Shop ${categoryLabel(category).toLowerCase()} at ${BRAND.name}.` }
    : { title: "Shop the collection", description: "Laptops, desktops, monitors, components and accessories." };
}

export default async function Shop({ searchParams }) {
  const sp = await searchParams;
  const category = CATEGORY_IDS.includes(sp.category) ? sp.category : null;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const sort = SORTS.some((s) => s.id === sp.sort) ? sp.sort : "featured";

  const all = await getProducts();
  const products = queryProducts(all, { category, q, sort });
  const searchable = queryProducts(all, { q });
  const counts = Object.fromEntries(
    CATEGORIES.map((c) => [c.id, searchable.filter((p) => p.category === c.id).length]),
  );
  const current = CATEGORIES.find((c) => c.id === category);

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <div className="eyebrow">The ReSale collection{current ? ` / ${current.label}` : ""}</div>
          <h1 className="display">
            {current ? (
              <>
                {current.label}
                <em>.</em>
              </>
            ) : (
              <>
                Discover your <em>next.</em>
              </>
            )}
          </h1>
          <p>{current ? current.tagline : "Carefully selected devices, made for real life."}</p>
        </div>
        <span className="page-head__meta">
          {products.length} product{products.length === 1 ? "" : "s"}
          {q ? ` for “${q}”` : ""}
        </span>
      </div>

      <ShopToolbar
        categories={CATEGORIES}
        counts={counts}
        total={searchable.length}
        category={category}
        q={q}
        sort={sort}
        sorts={SORTS}
        autoFocus={sp.focus === "search"}
      />

      {products.length ? (
        <Catalog products={products} priorityCount={4} />
      ) : (
        <div className="empty">
          <h2>
            Nothing here <em>yet.</em>
          </h2>
          <p>No products match {q ? `“${q}”` : "this filter"}. Try a different search or browse everything.</p>
          <Link href="/shop" className="btn btn--dark">
            <span>Clear filters</span> <ArrowRight size={17} />
          </Link>
        </div>
      )}
    </div>
  );
}
