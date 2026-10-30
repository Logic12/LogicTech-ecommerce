// Best-effort in-memory limiter (per server instance). Enough to slow down
// reference guessing on the tracking endpoint; use a shared store if you scale out.
const hits = new Map();

export function rateLimit(key, { limit = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > windowMs) hits.delete(k);
  return recent.length <= limit;
}

export const clientIp = (request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
