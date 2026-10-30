import { getProducts } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/categories";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap() {
  const site = siteUrl();
  const products = await getProducts();
  return [
    { url: `${site}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...["delivery", "warranty", "returns", "privacy", "terms"].map((p) => ({ url: `${site}/${p}`, changeFrequency: "monthly", priority: 0.4 })),
    ...CATEGORIES.map((c) => ({ url: `${site}/shop?category=${c.id}`, changeFrequency: "daily", priority: 0.7 })),
    ...products.map((p) => ({
      url: `${site}/product/${encodeURIComponent(p.id)}`,
      lastModified: p.createdAt || undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    })),
  ];
}
