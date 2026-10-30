// Server-only Sanity client with a write token. Never import this from a client component.
import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_WRITE_TOKEN;

let cached;

/** Returns null when Sanity or the token isn't configured (orders are then kept in Paystack only). */
export function getWriteClient() {
  if (!projectId || !token) return null;
  cached ||= createClient({
    projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2025-01-01",
    token,
    useCdn: false,
    perspective: "published",
  });
  return cached;
}

/**
 * Orders use a dotted ID ("order.<reference>"). Sanity never exposes documents
 * under a sub-path to unauthenticated reads — even in a public dataset — so
 * customer details stay private while products remain public.
 */
export const orderDocId = (reference) => `order.${reference}`;
