# v2.5.0 — Final pre-launch review

Fixes from a full audit before deployment:

- **Never sells demo products in production.** Previously, a missing Sanity project ID or a Sanity outage made the
  live site show the demo catalogue — and checkout would have taken real money at demo prices. Now production shows
  an empty store / keeps the last good page, and checkout refuses to price without Sanity.
- **Stock can't be undone by Studio drafts.** Sales also deduct stock from an open product draft, so publishing a
  product you were editing no longer restores the old stock number.
- **Order status changes are instant** (`liveEdit`): no Publish step to forget, so tracking always shows the
  latest status.
- **Webhooks from other sites on the same Paystack account** (e.g. another store) are acknowledged instead of
  rejected, so Paystack doesn't retry them for days.
- **Confirmation page removes only the paid products** from the bag (reopening an old confirmation link no longer wipes
  a new bag), retries on network blips, and offers "Check again" on errors.
- **Rate limits** on checkout, verification and quotes (protects your Paystack and Sanity quotas).
- **Site URL fallback** to Vercel's production domain, so emails, sitemap and previews never point at localhost.
- **Checkout picks a valid delivery option** when Standard delivery is switched off.
- **Studio isolated from the store's CSS**; root-level error page added.
- Orders with a zero total are refused; duplicate React keys on the receipt fixed.
- Minimum versions raised to the patched **Next 15.5.28 / React 19.3.1**.

# v2.4.2 — Paystack amount fix

- **Fixed: every real payment was flagged as a mismatch.** Paystack returns metadata numbers as strings
  ("812000"), and the amount check compared them strictly against the paid amount (812000). All metadata numbers are
  now converted before any comparison.
- Orders that were wrongly saved as "needs_review" by this bug heal themselves: the next visit to their confirmation
  or tracking page marks them paid, deducts stock once and sends the paid alert once.
- `npm run doctor` uses the same numeric comparison and points out "needs_review" orders.

# v2.4.1 — Verification fix

- A payment Paystack has confirmed now always shows **Payment confirmed**, even if saving the order to Sanity fails
  (e.g. a revoked or read-only token). The terminal prints exactly what's wrong; fix it and the order saves on the
  next visit to its confirmation or tracking page. Alerts still go out via the webhook.
- In development the error page shows a **Developer detail** line explaining failures (e.g. wrong Paystack key).
- Tracking falls back to Paystack if Sanity can't be read.
- New **`npm run doctor`** diagnostic (add a reference to trace one payment).

# v2.4 — Launch pack

- **Paid-order alerts, exactly once per order:** WhatsApp to 0558793259 and 0243735752 (CallMeBot) and email to
  earhin155@gmail.com (Resend). Mismatched payments send a "needs review" alert instead.
- **Customer receipt email** with a Track-your-order button (switches on once you verify a sending domain).
- **WhatsApp everywhere:** floating "Chat with us" button (hides on checkout and when the bag is open),
  "Ask about this item" on product pages, help link on tracking, both numbers in the footer.
- **Policy pages:** Delivery, Warranty (3 months), Returns (7 days), Privacy, Terms — with a shared layout, sticky
  section nav and WhatsApp help. Linked from footer, product page, cart and checkout.
- **Site settings in Studio:** WhatsApp numbers, public email, warranty months, return days, delivery options and fees
  (pricing reads them fresh; disabled options are rejected by the server).
- Home benefits now lead with the 3-month warranty and 7-day returns.

# v2.3 — No Firebase, order tracking

- **Firebase removed** (`firebase`, `firebase-admin`, service account). Run `npm install` to prune them.
- **Orders:** Paystack carries the priced order as metadata; on confirmed payment a private Sanity order
  (`order.<reference>`) is created and stock deducted in one transaction — exactly once, even with webhook retries.
- **Order admin in Studio:** new Orders list (newest first) with status, customer note, items, totals; orders can't be
  created or duplicated by hand.
- **Order tracking page** (`/track`): reference + email, animated timeline (delivery vs pickup wording), note from the
  store, refresh; opens pre-filled from the confirmation page. Wrong email and unknown reference return the same
  message; the endpoint is rate-limited; address and phone are never returned.
- Human-friendly references (`LTR-7KQ2M9XA`, no 0/O/1/I) shared by Paystack, Studio and the customer.
- Track links in header, mobile menu and footer.
- If a webhook is missed, the tracking page and confirmation page record the order themselves.

# v2.2 — LogicTech ReSale

- **Fix for the "messy" layout:** leftover v2.0 files (from extracting over the old folder) were rendering the old
  markup against the new styles. `npm run dev`/`build` now detect them; `npm run clean:legacy` removes them.
- Rebranded to **LogicTech ReSale** (`lib/brand.js`): new logo (LOGICTECH + serif *ReSale*), titles, metadata,
  footer wordmark, Studio title, JSON-LD seller.
- New icon set: SVG favicon, multi-size `favicon.ico`, Apple touch icon, PWA manifest + 192/512 icons
  (replaces the Accra City Cars icon your browser had cached for localhost:3000).
- Empty Sanity dataset: demo catalogue in development (with a console warning); "arriving soon" state in production.
- Mobile header: name fits on small phones; search and dark-mode toggle moved into the mobile menu.
- `allowedDevOrigins` for testing on your phone over Wi-Fi.

# v2.1 — Premium pass

## Security & payments
- `.env.local` removed from the package; `.env.example` added. **Rotate the Sanity read-write token that was in the previous zip.**
- Server-authoritative quote API: checkout totals come from the server, in pesewas.
- Initialise refuses to charge for a cart that changed since the customer reviewed it (409 + notices).
- Checkout pricing never falls back to demo prices if Sanity is down (pages still do).
- Contact details validated and sanitised on server and client (field-level errors).
- Shared `confirmPayment()` for verify + webhook; amount mismatches flagged `needs_review`, never paid.
- Paystack failed/abandoned payments shown as such; the bag is kept for retry.
- Security headers, 15s Paystack timeout, `init_failed` status if Paystack is unreachable.

## Bug fixes
- Footer logo no longer breaks onto two lines.
- Mobile navigation added (menu was hidden with no replacement).
- Sanity responses cached (60s revalidate) instead of fetching on every request.
- Delivery fees defined once (`lib/pricing.js`).
- Sanity specs: free-form label/value list; legacy objects still render with proper labels.
- `component` category (demo GPU) now reachable; categories defined once in `lib/categories.js`.
- Shop filters use `<Link>` (no full reloads); Monitors/Components in nav and homepage.
- Product pages get real titles, descriptions, OG images, canonical URLs and Product JSON-LD.
- Studio moved outside the store chrome.
- Existing customer carts migrate automatically to the new storage format.

## Premium UI
- Inter Tight + Instrument Serif via `next/font`.
- SCSS split into `@use` partials with design tokens; `data-theme` dark mode with no-flash boot script and View Transition cross-fade.
- Hero carousel: masked line reveals, crossfade + Ken Burns, synced progress timers, pause on hover/focus/hidden tab, swipe + arrow keys, no autoplay under reduced motion.
- Sticky header that shrinks and frosts on scroll; animated nav underlines.
- Slide-out cart drawer, add-to-bag toasts, animated +→✓ buttons, bag count bump.
- Product cards: second-image hover swap, discount and low-stock badges, sold-out state.
- Product gallery: thumbnails, swipe, hover zoom that follows the cursor; sticky buy box with quantity.
- Live search (debounced), category pills with counts, sort; sticky toolbar.
- Redesigned checkout: steps, radio-card delivery options, collapsing address, session-saved draft.
- Payment page: animated check, receipt, copyable reference, polling.
- Scroll reveals, editorial ticker, native scroll-driven parallax, category bento, outline wordmark footer.
- Skeleton loading, branded 404 and error pages, focus-visible styles, skip link, reduced-motion support throughout.
- Sitemap and robots.
