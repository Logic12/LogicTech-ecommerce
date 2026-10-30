import { cache } from "react";
import { createClient } from "@sanity/client";
import { PRODUCTS } from "../data/products";

/** How long storefront pages may serve a cached catalogue before refetching. */
export const CATALOG_REVALIDATE = 60;

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

export const client = projectId
  ? createClient({
      projectId,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
      apiVersion: "2025-01-01",
      useCdn: true,
      perspective: "published",
    })
  : null;

const QUERY = `*[_type == "product" && active != false] | order(_createdAt desc){
  "id": coalesce(slug.current, _id),
  "docId": _id,
  name, brand, category, condition, conditionLabel,
  price, originalPrice, stock, featured, badge, description, specs,
  "createdAt": _createdAt,
  "mainImage": mainImage.asset->{ url, "lqip": metadata.lqip },
  "images": images[].asset->{ url, "lqip": metadata.lqip }
}`;

/* ---------------------------------------------------------------- normalise */

const SPEC_ACRONYMS = {
  ram: "RAM", gpu: "GPU", cpu: "CPU", psu: "PSU", dpi: "DPI",
  vram: "VRAM", tdp: "TDP", pcie: "PCIe", ssd: "SSD", hdd: "HDD",
};

function labelize(key) {
  const raw = String(key);
  const acronym = SPEC_ACRONYMS[raw.toLowerCase()];
  if (acronym) return acronym;
  const spaced = raw
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Specs arrive in three shapes: the new Sanity array of {label, value},
 * legacy Sanity objects with fixed lowercase keys, or the demo objects.
 * Everything is normalised to an ordered [{label, value}] list.
 */
export function normalizeSpecs(specs) {
  if (!specs) return [];
  if (Array.isArray(specs)) {
    return specs
      .filter((s) => s && s.label && s.value)
      .map((s) => ({ label: String(s.label), value: String(s.value) }));
  }
  return Object.entries(specs)
    .filter(([key, value]) => !key.startsWith("_") && value != null && value !== "")
    .map(([key, value]) => ({ label: labelize(key), value: String(value) }));
}

function toImage(input) {
  if (!input) return null;
  if (typeof input === "string") return { url: input, lqip: null };
  return input.url ? { url: input.url, lqip: input.lqip || null } : null;
}

export function normalizeProduct(p) {
  const gallery = [];
  const seen = new Set();
  for (const img of [toImage(p.mainImage ?? p.image), ...(p.images || []).map(toImage)]) {
    if (img && !seen.has(img.url)) {
      seen.add(img.url);
      gallery.push(img);
    }
  }
  const price = Number(p.price) || 0;
  const originalPrice = Number(p.originalPrice) > price ? Number(p.originalPrice) : null;
  return {
    id: String(p.id),
    docId: p.docId || null, // Sanity _id (null for demo products) — used to adjust stock
    name: p.name || "Untitled product",
    brand: p.brand || null,
    category: p.category || "accessory",
    condition: p.condition || null,
    conditionLabel: p.conditionLabel || null,
    price,
    originalPrice,
    stock: Math.max(0, Math.floor(Number(p.stock) || 0)),
    featured: Boolean(p.featured),
    badge: p.badge || null,
    description: p.description || "",
    specs: normalizeSpecs(p.specs),
    image: gallery[0]?.url ?? null,
    lqip: gallery[0]?.lqip ?? null,
    gallery,
    createdAt: p.createdAt || null,
  };
}

const DEMO = PRODUCTS.map(normalizeProduct);

const IS_DEV = process.env.NODE_ENV !== "production";

let warnedEmpty = false;

/**
 * In development, an empty Sanity dataset falls back to the demo catalogue so
 * the design can be previewed. In production an empty dataset stays empty.
 */
function devFallbackIfEmpty(rows) {
  if (rows.length || !IS_DEV) return rows;
  if (!warnedEmpty) {
    warnedEmpty = true;
    console.warn(
      "[catalog] Sanity dataset has no active products — showing the demo catalogue (development only). Add products at /studio.",
    );
  }
  return DEMO;
}

/* ------------------------------------------------------------------ queries */

/**
 * Catalogue for rendering pages. Cached for CATALOG_REVALIDATE seconds and
 * de-duplicated per request.
 * - Development: falls back to the demo catalogue so the design can be previewed.
 * - Production: demo products are NEVER shown. If Sanity isn't configured the
 *   store is empty; if Sanity fails, the error propagates so Next keeps serving
 *   the last good version of the page instead of caching a broken one.
 */
export const getProducts = cache(async () => {
  if (!client) {
    if (IS_DEV) return DEMO;
    console.error("[catalog] NEXT_PUBLIC_SANITY_PROJECT_ID is not set — the store has no products.");
    return [];
  }
  try {
    const rows = await client.fetch(QUERY, {}, {
      next: { revalidate: CATALOG_REVALIDATE, tags: ["products"] },
    });
    return devFallbackIfEmpty(rows.map(normalizeProduct));
  } catch (e) {
    if (!IS_DEV) throw e;
    console.error("Sanity catalogue unavailable — serving demo catalogue (development only)", e?.message);
    return DEMO;
  }
});

/**
 * Catalogue for pricing a checkout. Always fresh (no CDN, no cache) and never
 * falls back to demo data — a payment must never be priced from stale or
 * placeholder prices. Throws if Sanity is configured but unreachable.
 */
export async function getProductsForPricing() {
  if (!client) {
    // Never take real money for demo products.
    if (IS_DEV) return DEMO;
    throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set — checkout is disabled.");
  }
  const rows = await client
    .withConfig({ useCdn: false })
    .fetch(QUERY, {}, { cache: "no-store" });
  return devFallbackIfEmpty(rows.map(normalizeProduct));
}

export async function getProduct(id) {
  const products = await getProducts();
  return products.find((p) => p.id === id) || null;
}

export async function getRelated(product, limit = 4) {
  const products = await getProducts();
  const others = products.filter((p) => p.id !== product.id);
  const same = others.filter((p) => p.category === product.category);
  const rest = others.filter((p) => p.category !== product.category);
  return [...same, ...rest].slice(0, limit);
}

export const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
];

/** Pure filter/sort used by the shop page. */
export function queryProducts(products, { category, q, sort } = {}) {
  let list = products;
  if (category) list = list.filter((p) => p.category === category);
  const term = (q || "").trim().toLowerCase();
  if (term) {
    const words = term.split(/\s+/);
    list = list.filter((p) => {
      const hay = [p.name, p.brand, p.category, p.conditionLabel, p.description,
        ...p.specs.map((s) => s.value)].join(" ").toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }
  const sorted = [...list];
  if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
  else if (sort === "newest")
    sorted.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  else sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.stock > 0) - Number(a.stock > 0));
  return sorted;
}
