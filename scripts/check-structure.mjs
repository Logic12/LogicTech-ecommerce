// Detects files left over from LogicTech v2.0. Those old pages fight the new
// (store) route group for the same URLs — e.g. app/page.jsx and
// app/(store)/page.jsx both claim "/" — and render the old markup against the
// new stylesheet. Runs automatically before `npm run dev` / `npm run build`.
//
//   node scripts/check-structure.mjs        check only (exit 1 if leftovers)
//   node scripts/check-structure.mjs --fix  delete the leftovers listed below
import { existsSync, readdirSync, rmdirSync, unlinkSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Exact files that v2.0 shipped and v2.1+ replaced. Nothing else is touched.
const LEGACY_FILES = [
  "app/page.jsx",
  "app/page.js",
  "app/shop/page.jsx",
  "app/product/[id]/page.jsx",
  "app/cart/page.jsx",
  "app/checkout/page.jsx",
  "app/payment/verify/page.jsx",
  "components/Storefront.jsx",
  "components/CartProvider.jsx",
];
// Folders removed only if they end up empty.
const LEGACY_DIRS = ["app/product/[id]", "app/product", "app/shop", "app/cart", "app/checkout", "app/payment/verify", "app/payment"];

const found = LEGACY_FILES.filter((f) => existsSync(join(root, f)));
const fix = process.argv.includes("--fix");

if (!found.length) {
  if (fix) console.log("✓ No leftover v2.0 files found.");
  process.exit(0);
}

if (fix) {
  for (const f of found) {
    unlinkSync(join(root, f));
    console.log("  removed " + f);
  }
  for (const d of LEGACY_DIRS) {
    const p = join(root, d);
    if (existsSync(p) && readdirSync(p).length === 0) rmdirSync(p);
  }
  console.log("\n✓ Cleaned up. Now restart: npm run dev\n");
  process.exit(0);
}

console.error(`
✖ Leftover files from the previous LogicTech version were found:

${found.map((f) => "    " + f).join("\n")}

  They override the new pages (old markup + new styles = a broken layout).
  This usually happens when a new zip is extracted over an old folder.

  Fix it with:   npm run clean:legacy
  (or delete the files above yourself), then run npm run dev again.
`);
process.exit(1);
