/**
 * Append today's prices to a CSV history and report what moved.
 * Run it from cron; the CSV is the whole database.
 *
 *   node track.mjs asins.txt --country us --history prices.csv
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { collect } from "./qd.mjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const flag = (n, d) => (args.indexOf(`--${n}`) === -1 ? d : args[args.indexOf(`--${n}`) + 1]);
const history = flag("history", "prices.csv");

if (!file) {
  console.error("usage: node track.mjs asins.txt [--country us] [--history prices.csv]");
  process.exit(1);
}

const asins = readFileSync(file, "utf8").split("\n").map((s) => s.trim()).filter(Boolean);
const rows = await collect("amazon_product", {
  asins,
  country: flag("country", "us"),
  max_results: asins.length,
});

const today = new Date().toISOString().slice(0, 10);

// Last known price per ASIN, read back out of the history file.
const previous = new Map();
if (existsSync(history)) {
  for (const line of readFileSync(history, "utf8").split("\n").slice(1)) {
    const [date, asin, price] = line.split(",");
    if (asin && price) previous.set(asin, { date, price: Number(price) });
  }
} else {
  writeFileSync(history, "date,asin,price_value,availability,title\n");
}

const lines = [];
for (const p of rows) {
  const price = p.price_value;
  if (typeof price !== "number") continue;
  const title = (p.title ?? "").replaceAll(",", " ").slice(0, 80);
  lines.push(`${today},${p.asin},${price},${(p.availability ?? "").replaceAll(",", " ")},${title}`);

  const before = previous.get(p.asin);
  if (before && before.price !== price) {
    const delta = (100 * (price - before.price)) / before.price;
    const arrow = price > before.price ? "▲" : "▼";
    console.log(
      `${arrow} ${p.asin}  ${before.price} → ${price}  (${delta.toFixed(1)}%)  ` +
        `since ${before.date}  ${title.slice(0, 50)}`,
    );
  }
}

appendFileSync(history, lines.join("\n") + "\n");
console.log(`\n${lines.length} rows appended to ${history}`);
