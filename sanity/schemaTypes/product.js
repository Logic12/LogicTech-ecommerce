import { CATEGORIES } from "../../lib/categories";

export default {
  name: "product",
  title: "Product",
  type: "document",
  groups: [
    { name: "main", title: "Main", default: true },
    { name: "commerce", title: "Price & stock" },
    { name: "media", title: "Images" },
    { name: "details", title: "Details" },
  ],
  fields: [
    { name: "name", type: "string", group: "main", validation: (r) => r.required() },
    {
      name: "slug",
      type: "slug",
      group: "main",
      options: { source: "name", maxLength: 96 },
      validation: (r) => r.required(),
    },
    { name: "brand", type: "string", group: "main" },
    {
      name: "category",
      type: "string",
      group: "main",
      options: { list: CATEGORIES.map((c) => ({ title: c.label, value: c.id })), layout: "radio" },
      validation: (r) => r.required(),
    },
    {
      name: "condition",
      type: "string",
      group: "main",
      options: { list: ["new", "refurbished", "used"], layout: "radio", direction: "horizontal" },
    },
    {
      name: "conditionLabel",
      title: "Condition grade",
      description: "Shown to customers, e.g. Brand New, Like New, Excellent, Good.",
      type: "string",
      group: "main",
    },
    {
      name: "price",
      title: "Price (GH₵)",
      type: "number",
      group: "commerce",
      validation: (r) => r.required().min(0).precision(2),
    },
    {
      name: "originalPrice",
      title: "Was price (GH₵)",
      description: "Optional. Shown struck through when higher than the price.",
      type: "number",
      group: "commerce",
      validation: (r) => r.min(0).precision(2),
    },
    {
      name: "stock",
      type: "number",
      group: "commerce",
      validation: (r) => r.required().integer().min(0),
    },
    { name: "mainImage", type: "image", group: "media", options: { hotspot: true } },
    { name: "images", title: "Gallery", type: "array", group: "media", of: [{ type: "image", options: { hotspot: true } }] },
    { name: "description", type: "text", rows: 4, group: "details" },
    {
      name: "specs",
      title: "Specifications",
      description: "Any label/value pairs, shown in this order — e.g. Processor / Intel Core i7-13700K.",
      type: "array",
      group: "details",
      of: [
        {
          type: "object",
          name: "spec",
          fields: [
            { name: "label", type: "string", validation: (r) => r.required() },
            { name: "value", type: "string", validation: (r) => r.required() },
          ],
          preview: { select: { title: "label", subtitle: "value" } },
        },
      ],
    },
    { name: "featured", type: "boolean", group: "main", initialValue: false },
    { name: "active", type: "boolean", group: "main", initialValue: true },
    { name: "badge", type: "string", group: "main", description: "Optional, e.g. Best Seller, New, Deal." },
  ],
  preview: {
    select: { title: "name", subtitle: "category", media: "mainImage", price: "price", stock: "stock" },
    prepare: ({ title, subtitle, media, price, stock }) => ({
      title,
      subtitle: [subtitle, price != null ? `GH₵ ${price}` : null, stock != null ? `${stock} in stock` : null]
        .filter(Boolean)
        .join(" · "),
      media,
    }),
  },
};
