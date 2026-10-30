import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Lock, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductActions } from "@/components/product/ProductActions";
import { Catalog } from "@/components/product/Catalog";
import { Reveal } from "@/components/ui/Reveal";
import { getProduct, getRelated } from "@/lib/catalog";
import { categoryLabel } from "@/lib/categories";
import { money, discountPercent } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { getSiteSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site";
import { WhatsAppLink } from "@/components/ui/WhatsAppLink";

export const revalidate = 60;

const decode = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = await getProduct(decode(id));
  if (!p) return { title: "Product not found" };
  const description = (p.description || `${p.name} at ${BRAND.name}.`).slice(0, 160);
  return {
    title: p.name,
    description,
    alternates: { canonical: `/product/${encodeURIComponent(p.id)}` },
    openGraph: { title: p.name, description, images: p.image ? [{ url: p.image }] : [] },
  };
}

const CONDITION_SCHEMA = {
  new: "https://schema.org/NewCondition",
  refurbished: "https://schema.org/RefurbishedCondition",
  used: "https://schema.org/UsedCondition",
};

export default async function ProductPage({ params }) {
  const { id } = await params;
  const p = await getProduct(decode(id));
  if (!p) notFound();
  const [related, settings] = await Promise.all([getRelated(p, 4), getSiteSettings()]);
  const site = siteUrl();
  const off = discountPercent(p.price, p.originalPrice);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.id,
    image: p.gallery.map((g) => g.url),
    description: p.description,
    ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
    ...(CONDITION_SCHEMA[p.condition] ? { itemCondition: CONDITION_SCHEMA[p.condition] } : {}),
    offers: {
      "@type": "Offer",
      seller: { "@type": "Organization", name: BRAND.name },
      price: p.price,
      priceCurrency: "GHS",
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${siteUrl()}/product/${encodeURIComponent(p.id)}`,
    },
  };

  return (
    <div className="container page page--product">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <ChevronRight size={13} />
        <Link href="/shop">Shop</Link>
        <ChevronRight size={13} />
        <Link href={`/shop?category=${p.category}`}>{categoryLabel(p.category)}</Link>
        <ChevronRight size={13} />
        <span aria-current="page">{p.name}</span>
      </nav>

      <div className="detail">
        <ProductGallery images={p.gallery} name={p.name} />

        <div className="detail__info">
          <div className="detail__tags">
            {p.conditionLabel && <span className="chip">{p.conditionLabel}</span>}
            {p.badge && <span className="chip chip--dark">{p.badge}</span>}
            <span className="eyebrow">{p.brand || categoryLabel(p.category)}</span>
          </div>

          <h1 className="detail__title">{p.name}</h1>

          <div className="detail__price">
            <strong>{money(p.price)}</strong>
            {p.originalPrice && (
              <>
                <del>{money(p.originalPrice)}</del>
                <span className="pill pill--accent">Save {off}%</span>
              </>
            )}
          </div>

          {p.description && <p className="detail__desc">{p.description}</p>}

          <p className={`stock ${p.stock < 1 ? "stock--out" : p.stock <= 3 ? "stock--low" : ""}`}>
            <span className="stock__dot" />
            {p.stock < 1 ? "Out of stock" : p.stock <= 3 ? `Only ${p.stock} left in stock` : `In stock · ${p.stock} available`}
          </p>

          <ProductActions product={p} />

          <WhatsAppLink
            number={settings.whatsappNumbers[0]}
            message={`Hi ${BRAND.name}, I'm interested in the ${p.name}${site ? ` (${site}/product/${encodeURIComponent(p.id)})` : ""}. Is it available?`}
            className="detail__ask"
          >
            Ask about this item on WhatsApp
          </WhatsAppLink>

          <ul className="assurance">
            <li>
              <ShieldCheck size={18} strokeWidth={1.6} />{" "}
              <span>
                <Link href="/warranty">{settings.warrantyMonths}-month warranty</Link> · quality checked before dispatch
              </span>
            </li>
            <li>
              <RotateCcw size={18} strokeWidth={1.6} />{" "}
              <span>
                <Link href="/returns">Return within {settings.returnDays} days</Link> of purchase
              </span>
            </li>
            <li>
              <Truck size={18} strokeWidth={1.6} /> <span>Delivery across Ghana or store pickup</span>
            </li>
            <li>
              <Lock size={18} strokeWidth={1.6} /> <span>Secure checkout with Paystack</span>
            </li>
          </ul>

          {p.specs.length > 0 && (
            <section className="specs" aria-labelledby="specs-title">
              <h2 id="specs-title">Technical details</h2>
              <dl>
                {p.specs.map((s) => (
                  <div key={s.label}>
                    <dt>{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="section section--tight">
          <Reveal className="section-head">
            <div>
              <div className="eyebrow">You may also like</div>
              <h2 className="display display--sm">
                Complete the <em>setup.</em>
              </h2>
            </div>
          </Reveal>
          <Catalog products={related} />
        </section>
      )}
    </div>
  );
}
