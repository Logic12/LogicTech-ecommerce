"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Package, Search, ShoppingBag } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { useCart } from "@/components/cart/CartProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { useLockBody } from "@/components/ui/useLockBody";

export function Header({ categories }) {
  const { count, bump, openDrawer, hydrated } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu on navigation and on Escape.
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);
  useLockBody(menuOpen);

  return (
    <>
      <div className="announcement">
        <p>
          <b className="announcement__lead">Premium technology. Carefully selected. </b>
          <span>Delivered across Ghana.</span>
        </p>
      </div>

      <header className={`header ${scrolled ? "is-scrolled" : ""} ${menuOpen ? "is-menu-open" : ""}`}>
        <div className="header__inner">
          <button
            type="button"
            className="burger"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
            <span />
          </button>

          <Logo />

          <nav className="header__nav" aria-label="Primary">
            <Link href="/shop" className={pathname === "/shop" ? "is-active" : ""}>
              Shop all
            </Link>
            {categories.map((c) => (
              <Link key={c.id} href={`/shop?category=${c.id}`}>
                {c.label}
              </Link>
            ))}
          </nav>

          <div className="header__actions">
            <Link href="/shop?focus=search" className="icon-btn" aria-label="Search products">
              <Search size={19} />
            </Link>
            <Link href="/track" className="icon-btn" aria-label="Track an order" title="Track an order">
              <Package size={19} />
            </Link>
            <ThemeToggle />
            <button
              type="button"
              className="bag-btn"
              onClick={openDrawer}
              aria-label={`Open bag${hydrated ? `, ${count} item${count === 1 ? "" : "s"}` : ""}`}
            >
              <ShoppingBag size={19} />
              <span key={bump} className={`bag-btn__count ${bump ? "is-bumped" : ""}`}>
                {hydrated ? count : 0}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={`mobile-menu ${menuOpen ? "is-open" : ""}`}
        inert={!menuOpen}
        aria-hidden={!menuOpen}
      >
        <Link href="/shop?focus=search" className="mobile-menu__search" style={{ "--i": 0 }}>
          <Search size={18} /> <span>Search products</span>
        </Link>
        <nav aria-label="Mobile">
          <Link href="/shop" style={{ "--i": 0 }}>
            <span>Shop all</span> <ArrowUpRight size={22} />
          </Link>
          {categories.map((c, i) => (
            <Link key={c.id} href={`/shop?category=${c.id}`} style={{ "--i": i + 1 }}>
              <span>{c.label}</span> <ArrowUpRight size={22} />
            </Link>
          ))}
        </nav>
        <div className="mobile-menu__foot" style={{ "--i": categories.length + 1 }}>
          <button
            type="button"
            className="btn btn--dark btn--block"
            onClick={() => {
              setMenuOpen(false);
              openDrawer();
            }}
          >
            <span>Your bag {hydrated && count ? `(${count})` : ""}</span> <ShoppingBag size={17} />
          </button>
          <Link href="/track" className="btn btn--ghost btn--block">
            <span>Track an order</span> <Package size={17} />
          </Link>
          <div className="mobile-menu__row">
            <span>Appearance</span>
            <ThemeToggle />
          </div>
          <p>{BRAND.name} — premium technology, delivered across Ghana.</p>
        </div>
      </div>
    </>
  );
}
