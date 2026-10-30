const clean = (v, max) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";

/**
 * Validate and sanitise checkout contact details before anything is persisted.
 * @returns {{ value: object, errors: Record<string,string> }}
 */
export function validateCustomer(input = {}, shippingId) {
  const errors = {};
  const email = clean(input.email, 254).toLowerCase();
  const name = clean(input.name, 120);
  const phone = clean(input.phone, 30);
  const address = clean(input.address, 500);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Enter a valid email address.";
  if (name.length < 2) errors.name = "Enter your full name.";
  const digits = phone.replace(/\D/g, "");
  if (!/^\+?[\d\s()-]+$/.test(phone) || digits.length < 9 || digits.length > 15)
    errors.phone = "Enter a valid phone number.";
  if (shippingId !== "pickup" && address.length < 6) errors.address = "Enter your delivery address.";

  return {
    value: { email, name, phone, address: shippingId === "pickup" ? "" : address },
    errors,
  };
}

export const isValidReference = (ref) => typeof ref === "string" && /^[a-zA-Z0-9_-]{6,64}$/.test(ref);
