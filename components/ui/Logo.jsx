import Link from "next/link";
import { BRAND } from "@/lib/brand";

/** LOGICTECH + serif-italic “ReSale”, with the L✦ mark in the header variant. */
export function Logo({ variant = "header", className = "" }) {
  return (
    <Link href="/" className={`logo logo--${variant} ${className}`} aria-label={`${BRAND.name} — home`}>
      {variant === "header" && (
        <span className="logo__mark" aria-hidden="true">
          L<span>✦</span>
        </span>
      )}
      <span className="logo__text" aria-hidden="true">
        <span className="logo__word">
          LOGIC<span>TECH</span>
        </span>
        <em className="logo__sub">{BRAND.sub}</em>
      </span>
    </Link>
  );
}
