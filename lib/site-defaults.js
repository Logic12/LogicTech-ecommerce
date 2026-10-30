// Defaults used until "Site settings" is filled in in the Studio — and as a
// fallback if Sanity is unreachable. Pure data: safe to import anywhere.
export const DEFAULT_SETTINGS = {
  whatsappNumbers: ["0558793259", "0243735752"],
  contactEmail: "",
  warrantyMonths: 3,
  returnDays: 7,
  deliveryOptions: [
    { id: "standard", label: "Standard delivery", detail: "Delivered to your door", fee: 50, enabled: true },
    { id: "express", label: "Express delivery", detail: "Priority handling and dispatch", fee: 120, enabled: true },
    { id: "pickup", label: "Store pickup", detail: "Collect from our store", fee: 0, enabled: true },
  ],
};

export const DELIVERY_IDS = ["standard", "express", "pickup"];
