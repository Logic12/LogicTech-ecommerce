import Link from "next/link";
import { ArrowUpRight, RotateCcw, ShieldCheck, Truck, Lock } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { Catalog } from "@/components/product/Catalog";
import { Reveal } from "@/components/ui/Reveal";
import { Img } from "@/components/ui/Img";
import { getProducts } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/categories";

export const revalidate = 60;

const SLIDES = [
  {
    id: "performance",
    label: "The performance collection",
    kicker: "The ReSale edition / 2026",
    title: ["Technology.", "Elevated."],
    copy: "Remarkable performance. Timeless design. Discover exceptional devices, thoughtfully selected for the way you live and work.",
    primary: { label: "Explore the collection", href: "/shop" },
    secondary: { label: "Discover laptops", href: "/shop?category=laptop" },
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1600&q=85",
    imageAlt: "Premium laptop on a minimal workspace",
  },
  {
    id: "desktops",
    label: "The desktop collection",
    kicker: "Built for play / Desktops",
    title: ["Raw power.", "Refined."],
    copy: "Desktops and components configured for gaming, creating and everything in between.",
    primary: { label: "Shop desktops", href: "/shop?category=desktop" },
    secondary: { label: "Upgrade components", href: "/shop?category=component" },
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=1600&q=85",
    imageAlt: "High-performance computer setup",
  },
  {
    id: "workspace",
    label: "The workspace edit",
    kicker: "The finishing touch / Accessories",
    title: ["Every detail.", "Considered."],
    copy: "Monitors, keyboards and essentials that complete a workspace you’ll love sitting down to.",
    primary: { label: "Shop accessories", href: "/shop?category=accessory" },
    secondary: { label: "View monitors", href: "/shop?category=monitor" },
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1600&q=85",
    imageAlt: "Beautiful premium workspace",
  },
];

const benefits = (s) => [
  { icon: ShieldCheck, title: `${s.warrantyMonths}-month warranty`, text: "Quality checked, every device", href: "/warranty" },
  { icon: RotateCcw, title: `${s.returnDays}-day returns`, text: "Not right? Send it back", href: "/returns" },
  { icon: Truck, title: "Delivery across Ghana", text: "Or collect from our store", href: "/delivery" },
  { icon: Lock, title: "Secure checkout", text: "Card or mobile money via Paystack", href: null },
];

const TICKER = ["Technology, elevated", "Carefully selected", "Delivered across Ghana", "Built for what’s next"];

export default async function Home() {
  const [products, settings] = await Promise.all([getProducts(), getSiteSettings()]);
  const featured = [
    ...products.filter((p) => p.featured),
    ...products.filter((p) => !p.featured),
  ].slice(0, 4);
  const counts = Object.fromEntries(
    CATEGORIES.map((c) => [c.id, products.filter((p) => p.category === c.id).length]),
  );

  return (
    <>
      <HeroCarousel slides={SLIDES} />

      <section className="benefits" aria-label="Why LogicTech ReSale">
        {benefits(settings).map(({ icon: Icon, title, text, href }, i) => (
          <Reveal key={title} className="benefit" delay={i * 80}>
            <Icon size={22} strokeWidth={1.6} />
            {href ? (
              <Link href={href} className="benefit__title">
                {title}
              </Link>
            ) : (
              <span className="benefit__title">{title}</span>
            )}
            <small>{text}</small>
          </Reveal>
        ))}
      </section>

      <section className="container section">
        <Reveal className="section-head">
          <div>
            <div className="eyebrow">01 / The collection</div>
            <h2 className="display">
              Designed to do <em>more.</em>
            </h2>
            <p>Powerful essentials. Exceptional value. No compromises.</p>
          </div>
          <Link href="/shop" className="link-arrow">
            View all products <ArrowUpRight size={18} />
          </Link>
        </Reveal>
        <Catalog products={featured} />
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker__track">
          {[0, 1].map((k) => (
            <div className="ticker__group" key={k}>
              {TICKER.map((t) => (
                <span key={t}>
                  <em>{t}</em> <i>✦</i>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="editorial">
        <div className="editorial__media">
          <Img
            src="https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=1600&q=85"
            alt="Laptop on a calm, minimal desk"
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
            className="editorial__img"
          />
        </div>
        <Reveal className="editorial__copy">
          <div className="eyebrow">Beyond the specifications</div>
          <h2 className="display">
            Good tech changes
            <br />
            your <em>everyday.</em>
          </h2>
          <p>
            From your first idea to your biggest breakthrough, find a device that keeps up with your ambition.
          </p>
          <Link href="/shop" className="btn btn--dark">
            <span>Find your next upgrade</span> <ArrowUpRight size={18} />
          </Link>
        </Reveal>
      </section>

      <section className="container section">
        <Reveal className="section-head">
          <div>
            <div className="eyebrow">02 / Discover more</div>
            <h2 className="display">
              Explore the <em>essentials.</em>
            </h2>
          </div>
        </Reveal>
        <div className="bento">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.id} className={`bento__cell bento__cell--${i + 1}`} delay={i * 70}>
              <Link href={`/shop?category=${c.id}`} className="bento__link">
                <span className="bento__label">{c.label}</span>
                <strong>{c.tagline}</strong>
                <span className="bento__foot">
                  <span>
                    {counts[c.id]} product{counts[c.id] === 1 ? "" : "s"}
                  </span>
                  <span className="bento__arrow">
                    <ArrowUpRight size={20} />
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
