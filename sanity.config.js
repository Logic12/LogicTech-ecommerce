"use client";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import product from "./sanity/schemaTypes/product";
import order from "./sanity/schemaTypes/order";
import siteSettings from "./sanity/schemaTypes/siteSettings";

export default defineConfig({
  name: "default",
  title: "LogicTech ReSale CMS",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "missing",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  basePath: "/studio",
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("LogicTech ReSale")
          .items([
            S.documentTypeListItem("product").title("Products"),
            S.listItem()
              .title("Orders")
              .child(
                S.documentTypeList("order")
                  .title("Orders")
                  .defaultOrdering([{ field: "paidAt", direction: "desc" }]),
              ),
            S.divider(),
            S.listItem()
              .title("Site settings")
              .id("siteSettings")
              .child(S.document().schemaType("siteSettings").documentId("siteSettings").title("Site settings")),
          ]),
    }),
  ],
  schema: { types: [product, order, siteSettings] },
  document: {
    // Orders are created by checkout only, never by hand.
    newDocumentOptions: (prev) => prev.filter((t) => !["order", "siteSettings"].includes(t.templateId)),
    // Duplicating an order would give the copy a public ID — and expose customer details.
    // Settings is a single document: no duplicate or delete.
    actions: (prev, ctx) => {
      if (ctx.schemaType === "order") return prev.filter((a) => a.action !== "duplicate");
      if (ctx.schemaType === "siteSettings") return prev.filter((a) => !["duplicate", "delete", "unpublish"].includes(a.action));
      return prev;
    },
  },
});
