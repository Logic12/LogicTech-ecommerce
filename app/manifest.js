import { BRAND } from "@/lib/brand";

export default function manifest() {
  return {
    name: BRAND.name,
    short_name: "ReSale",
    description: BRAND.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0e1112",
    theme_color: "#15191a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
