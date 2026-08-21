/**
 * Amazon keyword search -> ranked rows, with the numbers you actually look at.
 *   node search.mjs "running shoes" --country us --max 60 --csv shoes.csv
 */
import { writeFileSync } from "node:fs";
import { collect, toCsv } from "./qd.mjs";

const args = process.argv.slice(2);
const query = args.find((a) => !a.startsWith("--"));
if (!query) {
  console.error('usage: node search.mjs "<query>" [--country us] [--max 60] [--csv file.csv]');
  process.exit(1);
}
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const rows = await collect("amazon_search", {
  query,
  country: flag("country", "us"),
  max_results: Number(flag("max", 40)),
});

const priced = rows.filter((r) => typeof r.price_value === "number");
const prices = priced.map((r) => r.price_value).sort((a, b) => a - b);
const sponsored = rows.filter((r) => r.sponsored).length;
const discounted = rows.filter((r) => r.list_price && r.price_value).length;

console.log(`${rows.length} products for "${query}"`);
console.log(`  sponsored : ${sponsored} (${Math.round((100 * sponsored) / rows.length)}%)`);
if (prices.length) {
  const median = prices[Math.floor(prices.length / 2)];
  console.log(`  price     : ${prices[0]} … ${prices.at(-1)}  (median ${median})`);
}
console.log(`  discounted: ${discounted}\n`);

for (const r of rows.slice(0, 15)) {
  const tag = r.sponsored ? "AD" : "  ";
  console.log(
    `${tag} ${String(r.rank).padStart(3)}. ${r.price ?? "-"} ` +
      `${r.rating ?? "-"}★ (${r.reviews ?? 0})  ${(r.title ?? "").slice(0, 70)}`,
  );
}

const csv = flag("csv", null);
if (csv) {
  writeFileSync(csv, toCsv(rows, ["rank", "page", "asin", "title", "brand", "price",
    "price_value", "list_price", "rating", "reviews", "sponsored", "delivery", "url"]));
  console.log(`\nwrote ${csv}`);
}
