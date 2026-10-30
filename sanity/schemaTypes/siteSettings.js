import { DEFAULT_SETTINGS } from "../../lib/site-defaults";

// Single document (ID "siteSettings"). It is publicly readable — don't put
// private emails or API keys here; those belong in environment variables.
export default {
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  groups: [
    { name: "contact", title: "Contact", default: true },
    { name: "policies", title: "Warranty & returns" },
    { name: "delivery", title: "Delivery" },
  ],
  fields: [
    {
      name: "whatsappNumbers",
      title: "WhatsApp numbers",
      description: "Shown to customers. The first one is used for the chat button. e.g. 0558793259",
      type: "array",
      group: "contact",
      of: [{ type: "string" }],
      initialValue: DEFAULT_SETTINGS.whatsappNumbers,
      validation: (r) =>
        r.min(1).custom((list = []) =>
          list.every((n) => String(n).replace(/\D/g, "").length >= 9) || "Enter full phone numbers",
        ),
    },
    {
      name: "contactEmail",
      title: "Public contact email",
      description: "Optional. Shown in the footer and on policy pages.",
      type: "string",
      group: "contact",
      validation: (r) => r.email(),
    },
    {
      name: "warrantyMonths",
      title: "Warranty (months)",
      type: "number",
      group: "policies",
      initialValue: DEFAULT_SETTINGS.warrantyMonths,
      validation: (r) => r.required().integer().min(0),
    },
    {
      name: "returnDays",
      title: "Return window (days)",
      type: "number",
      group: "policies",
      initialValue: DEFAULT_SETTINGS.returnDays,
      validation: (r) => r.required().integer().min(0),
    },
    {
      name: "deliveryOptions",
      title: "Delivery options",
      description: "Fees apply to the next checkout immediately.",
      type: "array",
      group: "delivery",
      initialValue: DEFAULT_SETTINGS.deliveryOptions.map((o) => ({ ...o, _key: o.id, _type: "deliveryOption" })),
      of: [
        {
          type: "object",
          name: "deliveryOption",
          fields: [
            {
              name: "id",
              title: "Type",
              type: "string",
              options: {
                list: [
                  { title: "Standard delivery", value: "standard" },
                  { title: "Express delivery", value: "express" },
                  { title: "Store pickup", value: "pickup" },
                ],
              },
              validation: (r) => r.required(),
            },
            { name: "label", type: "string", validation: (r) => r.required() },
            { name: "detail", title: "Timing / description", type: "string" },
            { name: "fee", title: "Fee (GH₵)", type: "number", validation: (r) => r.required().min(0) },
            { name: "enabled", type: "boolean", initialValue: true },
          ],
          preview: {
            select: { title: "label", fee: "fee", enabled: "enabled", detail: "detail" },
            prepare: ({ title, fee, enabled, detail }) => ({
              title: `${title}${enabled === false ? " (off)" : ""}`,
              subtitle: `${fee ? `GH₵ ${fee}` : "Free"}${detail ? ` · ${detail}` : ""}`,
            }),
          },
        },
      ],
    },
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
};
