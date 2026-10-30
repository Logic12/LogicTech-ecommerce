// Phone/WhatsApp helpers — pure, safe in client and server code.

/** "0558793259" | "+233 55 879 3259" | "233558793259" → "233558793259" (Ghana default). */
export function toIntl(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return "233" + digits.slice(1);
  return digits.length === 9 ? "233" + digits : digits;
}

/** "233558793259" → "055 879 3259" */
export function displayPhone(phone) {
  const intl = toIntl(phone);
  if (!intl.startsWith("233") || intl.length !== 12) return phone;
  const local = "0" + intl.slice(3);
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

/** wa.me deep link with an optional pre-filled message. */
export function whatsappLink(phone, text) {
  const intl = toIntl(phone);
  if (!intl) return null;
  return `https://wa.me/${intl}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
