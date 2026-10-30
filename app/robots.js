import { siteUrl } from "@/lib/site";

export default function robots() {
  const site = siteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/studio", "/api", "/checkout", "/payment", "/cart"] },
    sitemap: `${site}/sitemap.xml`,
  };
}
