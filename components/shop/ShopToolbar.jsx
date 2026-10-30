"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

function buildHref({ category, q, sort }) {
  const p = new URLSearchParams();
  if (category) p.set("category", category);
  if (q) p.set("q", q);
  if (sort && sort !== "featured") p.set("sort", sort);
  const s = p.toString();
  return s ? `/shop?${s}` : "/shop";
}

export function ShopToolbar({ categories, counts, total, category, q, sort, sorts, autoFocus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [term, setTerm] = useState(q);
  const inputRef = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Debounced live search.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      startTransition(() => router.replace(buildHref({ category, q: term.trim(), sort }), { scroll: false }));
    }, 280);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  return (
    <div className={`toolbar ${pending ? "is-pending" : ""}`}>
      <div className="toolbar__pills" role="list">
        <Link role="listitem" href={buildHref({ q, sort })} className={!category ? "is-active" : ""} scroll={false}>
          All <sup>{total}</sup>
        </Link>
        {categories.map((c) => (
          <Link
            role="listitem"
            key={c.id}
            href={buildHref({ category: c.id, q, sort })}
            className={category === c.id ? "is-active" : ""}
            scroll={false}
          >
            {c.label} <sup>{counts[c.id] ?? 0}</sup>
          </Link>
        ))}
      </div>

      <div className="toolbar__controls">
        <label className="search-field">
          <Search size={17} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search products"
            aria-label="Search products"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            maxLength={80}
          />
          {term && (
            <button type="button" onClick={() => setTerm("")} aria-label="Clear search">
              <X size={15} />
            </button>
          )}
        </label>
        <label className="select-field">
          <span className="visually-hidden">Sort by</span>
          <select
            value={sort}
            onChange={(e) =>
              startTransition(() =>
                router.replace(buildHref({ category, q: term.trim(), sort: e.target.value }), { scroll: false }),
              )
            }
          >
            {sorts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="toolbar__progress" aria-hidden="true" />
    </div>
  );
}
