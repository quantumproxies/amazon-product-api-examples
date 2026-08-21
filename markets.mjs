/**
 * One ASIN, several marketplaces — `country` switches the Amazon site, not just the exit IP.
 *   node markets.mjs B0DPHTLDYK us gb de fr it es
 */
import { collect } from "./qd.mjs";

const [asin, ...markets] = process.argv.slice(2);
if (!asin) {
  console.error("usage: node markets.mjs <ASIN> [country…]");
  process.exit(1);
}
const countries = markets.length ? markets : ["us", "gb", "de", "fr", "it", "es"];

const results = await Promise.all(
  countries.map(async (country) => {
    try {
      const [row] = await collect("amazon_product", { asins: [asin], country, max_results: 1 });
      return { country, row };
    } catch (err) {
      return { country, error: err.message };
    }
  }),
);

console.log(`${asin}\n`);
console.log(`${"market".padEnd(8)}${"price".padEnd(14)}${"rating".padEnd(9)}availability`);
for (const { country, row, error } of results) {
  if (error) {
    console.log(`${country.padEnd(8)}!! ${error}`);
    continue;
  }
  if (!row) {
    console.log(`${country.padEnd(8)}not listed`);
    continue;
  }
  console.log(
    country.padEnd(8) +
      String(row.price ?? "-").padEnd(14) +
      String(row.rating ?? "-").padEnd(9) +
      (row.availability ?? "-"),
  );
}
