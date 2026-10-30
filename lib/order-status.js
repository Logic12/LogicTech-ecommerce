// Device-local memory of the last order (reference + email) so tracking pre-fills.
export const LAST_ORDER_KEY = "lt_last_order";

// Order statuses — shared by the Sanity schema, the tracking API and the tracking page.
export const ORDER_STATUSES = [
  { value: "paid", title: "Paid — new order" },
  { value: "processing", title: "Preparing order" },
  { value: "ready", title: "Out for delivery / Ready for pickup" },
  { value: "completed", title: "Delivered / Collected" },
  { value: "cancelled", title: "Cancelled / Refunded" },
  { value: "needs_review", title: "Needs review (payment mismatch)" },
];

const FLOW = ["paid", "processing", "ready", "completed"];

/** Customer-facing steps for the tracking timeline. */
export function trackingSteps(shipping) {
  const pickup = shipping === "pickup";
  return [
    { key: "paid", label: "Order confirmed", detail: "Payment received" },
    { key: "processing", label: "Preparing", detail: pickup ? "Checking and packing your items" : "Quality check and packing" },
    { key: "ready", label: pickup ? "Ready for pickup" : "Out for delivery", detail: pickup ? "Collect from our store" : "On its way to you" },
    { key: "completed", label: pickup ? "Collected" : "Delivered", detail: "Enjoy your new tech" },
  ];
}

/** Index of the current step (−1 for statuses outside the normal flow). */
export const stepIndex = (status) => FLOW.indexOf(status);
