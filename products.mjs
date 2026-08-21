/**
 * ASINs -> detail rows (availability, seller, categories, feature bullets).
 *   node products.mjs B0DPHTLDYK B0DT1KPWHP --country us
 */
import { collect } from "./qd.mjs";

const args = process.argv.slice(2);
const country = args.includes("--country") ? args[args.indexOf("--country") + 1] : "us";
const asins = args.filter((a) => /^[A-Z0-9]{10}$/.test(a));

if (!asins.length) {
  console.error("usage: node products.mjs <ASIN> [ASIN…] [--country us]");
  process.exit(1);
}

const rows = await collect("amazon_product", { asins, country, max_results: asins.length });

for (const p of rows) {
  console.log(`\n${p.asin}  ${p.title ?? ""}`);
  console.log(`  brand       ${p.brand ?? "-"}`);
  console.log(`  price       ${p.price ?? "-"}${p.list_price ? `  (list ${p.list_price})` : ""}`);
  console.log(`  rating      ${p.rating ?? "-"}★ over ${p.reviews ?? 0} reviews`);
  console.log(`  stock       ${p.availability ?? "-"}`);
  console.log(`  seller      ${p.seller ?? "-"}`);
  console.log(`  delivery    ${p.delivery ?? "-"}`);
  console.log(`  categories  ${(p.categories ?? []).join(" > ") || "-"}`);
  for (const f of (p.features ?? []).slice(0, 5)) console.log(`   • ${f}`);
}

const missing = asins.filter((a) => !rows.some((r) => r.asin === a));
if (missing.length) console.log(`\nnot returned for ${country}: ${missing.join(", ")}`);
