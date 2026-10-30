import { ORDER_STATUSES } from "../../lib/order-status";

// Orders are created by the server only, with private IDs ("order.<reference>").
// Update the status here — the customer sees it on the tracking page.
export default {
  name: "order",
  title: "Order",
  type: "document",
  // Changes save straight to the live order — no Publish button to forget, so the
  // customer's tracking page updates as soon as you change the status.
  liveEdit: true,
  fields: [
    { name: "reference", title: "Order reference", type: "string", readOnly: true },
    {
      name: "status",
      type: "string",
      options: { list: ORDER_STATUSES, layout: "radio" },
      initialValue: "paid",
      validation: (r) => r.required(),
    },
    {
      name: "trackingNote",
      title: "Note for the customer",
      description: "Optional. Shown on the tracking page, e.g. “Rider Kwame will call before arriving.”",
      type: "text",
      rows: 2,
    },
    {
      name: "customer",
      type: "object",
      readOnly: true,
      fields: [
        { name: "name", type: "string" },
        { name: "email", type: "string" },
        { name: "phone", type: "string" },
      ],
    },
    {
      name: "delivery",
      type: "object",
      readOnly: true,
      fields: [
        { name: "method", type: "string" },
        { name: "label", type: "string" },
        { name: "address", type: "text", rows: 2 },
      ],
    },
    {
      name: "items",
      type: "array",
      readOnly: true,
      of: [
        {
          type: "object",
          name: "orderItem",
          fields: [
            { name: "productId", title: "Product slug", type: "string" },
            { name: "name", type: "string" },
            { name: "qty", type: "number" },
            { name: "unitPrice", title: "Unit price (GH₵)", type: "number" },
          ],
          preview: {
            select: { name: "name", qty: "qty", price: "unitPrice" },
            prepare: ({ name, qty, price }) => ({ title: `${qty}× ${name}`, subtitle: `GH₵ ${price}` }),
          },
        },
      ],
    },
    { name: "subtotal", title: "Subtotal (GH₵)", type: "number", readOnly: true },
    { name: "deliveryFee", title: "Delivery (GH₵)", type: "number", readOnly: true },
    { name: "total", title: "Total paid (GH₵)", type: "number", readOnly: true },
    { name: "totalMinor", type: "number", readOnly: true, hidden: true },
    { name: "paidAt", type: "datetime", readOnly: true },
    { name: "paymentChannel", type: "string", readOnly: true },
    {
      name: "stockAdjusted",
      title: "Stock deducted automatically",
      description: "If unticked, adjust product stock by hand.",
      type: "boolean",
      readOnly: true,
    },
  ],
  orderings: [{ title: "Newest first", name: "paidAtDesc", by: [{ field: "paidAt", direction: "desc" }] }],
  preview: {
    select: { ref: "reference", name: "customer.name", total: "total", status: "status" },
    prepare: ({ ref, name, total, status }) => ({
      title: `${ref} — ${name || "Customer"}`,
      subtitle: `${ORDER_STATUSES.find((s) => s.value === status)?.title ?? status} · GH₵ ${total ?? "—"}`,
    }),
  },
};
