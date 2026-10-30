// Single source of truth for categories — used by nav, shop filters, homepage and the Sanity schema.
export const CATEGORIES = [
  { id: "laptop", label: "Laptops", tagline: "Work without limits." },
  { id: "desktop", label: "Desktops", tagline: "Power your potential." },
  { id: "monitor", label: "Monitors", tagline: "See every detail." },
  { id: "component", label: "Components", tagline: "Upgrade from within." },
  { id: "accessory", label: "Accessories", tagline: "Every detail matters." },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id ?? "";
}
