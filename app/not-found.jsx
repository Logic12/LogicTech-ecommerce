import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StoreShell } from "@/components/layout/StoreShell";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <StoreShell>
      <div className="container page state-page">
        <div className="eyebrow">404 / NOT FOUND</div>
        <h1 className="display">
          This page has <em>moved on.</em>
        </h1>
        <p>The product may have sold out or the link may be outdated. The collection is just a click away.</p>
        <div className="state-page__actions">
          <Link className="btn btn--dark" href="/shop">
            <span>Explore the collection</span> <ArrowUpRight size={18} />
          </Link>
          <Link className="btn btn--ghost" href="/">
            <span>Back home</span>
          </Link>
        </div>
      </div>
    </StoreShell>
  );
}
