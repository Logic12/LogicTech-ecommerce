// Policy page content. Numbers (warranty, returns, delivery fees) come from Site
// settings so they always match the rest of the site.
// REVIEW BEFORE LAUNCH: the wording beyond the warranty length and return window
// is a sensible default drafted for you — adjust it to how you actually operate.
import { BRAND } from "./brand";
import { displayPhone } from "./contact";
import { money } from "./format";

export const POLICY_UPDATED = "2026-10-30";

export const POLICY_NAV = [
  { slug: "delivery", title: "Delivery" },
  { slug: "warranty", title: "Warranty" },
  { slug: "returns", title: "Returns" },
  { slug: "privacy", title: "Privacy" },
  { slug: "terms", title: "Terms" },
];

const contactLine = (s) =>
  `WhatsApp ${s.whatsappNumbers.map(displayPhone).join(" or ")}${s.contactEmail ? `, or email ${s.contactEmail}` : ""}`;

export function getPolicy(slug, s) {
  const m = s.warrantyMonths;
  const d = s.returnDays;
  const policies = {
    warranty: {
      title: "Warranty",
      eyebrow: `${m}-month warranty`,
      lead: `Every device we sell comes with a ${m}-month warranty from the day you receive it — so you can buy refurbished and pre-owned tech with confidence.`,
      sections: [
        {
          heading: "What’s covered",
          body: [
            "Hardware faults that appear during normal use — for example a screen, keyboard, trackpad, port, storage drive or motherboard that stops working as it should.",
          ],
        },
        {
          heading: "What isn’t covered",
          list: [
            "Accidental damage, such as drops, cracks or liquid damage.",
            "Damage from misuse, power surges, or repairs and modifications not carried out by us.",
            "Software problems, viruses or lost data — please keep your files backed up.",
            "Cosmetic wear already described in the product’s condition grade.",
          ],
        },
        {
          heading: "How to make a claim",
          steps: [
            `Message us — ${contactLine(s)} — with your order reference and a short description, photo or video of the fault.`,
            "We’ll help you troubleshoot, and if needed arrange for us to inspect the device.",
            "If the fault is covered, we’ll repair or replace the item. If neither is possible, we’ll refund you.",
          ],
        },
        {
          heading: "Your proof of purchase",
          body: [
            "Your order reference (it starts with “LTR-”) is your proof of purchase. You’ll find it on your confirmation page, in your Paystack receipt and on the tracking page.",
          ],
        },
      ],
    },

    returns: {
      title: "Returns",
      eyebrow: `${d}-day returns`,
      lead: `Changed your mind, or the item isn’t right for you? You can return it within ${d} days of purchase.`,
      sections: [
        {
          heading: "What can be returned",
          list: [
            `Items returned within ${d} days of the purchase date.`,
            "In the same condition you received them, with all accessories, cables and packaging.",
            "Signed out of any accounts you added (Apple ID / iCloud, Microsoft or Google) so the device can be reset.",
          ],
        },
        {
          heading: "How to return an item",
          steps: [
            `Message us — ${contactLine(s)} — with your order reference and the reason for the return.`,
            "We’ll confirm how to send or drop off the item, including any delivery costs.",
            "Once we’ve inspected it, we’ll refund you to your original payment method through Paystack.",
          ],
        },
        {
          heading: "Refund timing",
          body: [
            "Refunds are issued after the returned item has been inspected. How long the money takes to reach you depends on your bank or mobile money provider.",
          ],
        },
        {
          heading: "Faulty items",
          body: [`If something stops working, you’re also covered by our ${m}-month warranty.`],
          link: { href: "/warranty", label: "Read the warranty" },
        },
      ],
    },

    delivery: {
      title: "Delivery",
      eyebrow: "Delivery & pickup",
      lead: "We deliver across Ghana, or you can collect your order from our store.",
      sections: [
        {
          heading: "Options and fees",
          table: s.deliveryOptions.map((o) => [o.label, o.detail, o.fee ? money(o.fee) : "Free"]),
        },
        {
          heading: "Tracking your order",
          body: [
            "As soon as your payment is confirmed you’ll get an order reference. Use it with the email you paid with to follow your order at any time.",
          ],
          link: { href: "/track", label: "Track an order" },
        },
        {
          heading: "Collecting from our store",
          body: [
            "Choose store pickup at checkout and come by once your order shows “Ready for pickup”. Please bring your order reference.",
          ],
        },
        { heading: "Questions", body: [`${contactLine(s)} — we’re happy to help.`] },
      ],
    },

    privacy: {
      title: "Privacy",
      eyebrow: "Privacy policy",
      lead: `This explains what ${BRAND.name} collects when you shop with us and how we use it.`,
      sections: [
        {
          heading: "What we collect",
          list: [
            "Your name, email address, phone number and delivery address.",
            "The items you order and confirmation of your payment.",
            "We never see or store your card details or mobile money PIN — payments are processed by Paystack.",
          ],
        },
        {
          heading: "How we use it",
          list: [
            "To process, deliver and support your order, including warranty claims and returns.",
            "To contact you about your order.",
            "To keep the records we need for accounting.",
          ],
          body: ["We don’t sell your personal information."],
        },
        {
          heading: "Who we share it with",
          list: [
            "Paystack, to process your payment.",
            "The services we use to store order records securely and send order updates.",
            "The person delivering your order, who needs your name, phone number and address.",
          ],
        },
        {
          heading: "Keeping and controlling your data",
          body: [
            "We keep order records for as long as we need them for warranty, returns and accounting. You can ask to see, correct or delete your information at any time.",
            "We aim to handle personal data in line with Ghana’s Data Protection Act, 2012 (Act 843).",
          ],
        },
        { heading: "Contact", body: [`${contactLine(s)}.`] },
      ],
    },

    terms: {
      title: "Terms",
      eyebrow: "Terms of sale",
      lead: `These terms apply when you buy from ${BRAND.name}. By placing an order you agree to them.`,
      sections: [
        {
          heading: "Products and condition",
          body: [
            "Our devices may be brand new, refurbished or pre-owned. Each product page states its condition and specifications, and we describe them as accurately as we can.",
          ],
        },
        {
          heading: "Prices and payment",
          body: [
            "Prices are in Ghana cedis (GH₵). Delivery fees are shown at checkout before you pay. Payments are processed securely by Paystack, and your order is confirmed only once payment has been verified.",
          ],
        },
        {
          heading: "Availability",
          body: [
            "Stock is limited. If an item becomes unavailable after you’ve paid, we’ll contact you and refund that item in full.",
          ],
        },
        {
          heading: "Delivery, warranty and returns",
          body: [
            `Delivery, our ${m}-month warranty and ${d}-day returns are described on their own pages, which form part of these terms.`,
          ],
          links: [
            { href: "/delivery", label: "Delivery" },
            { href: "/warranty", label: "Warranty" },
            { href: "/returns", label: "Returns" },
          ],
        },
        { heading: "Governing law", body: ["These terms are governed by the laws of Ghana."] },
        { heading: "Contact", body: [`${contactLine(s)}.`] },
      ],
    },
  };
  return policies[slug] || null;
}
