# Amazon product API in Node.js — ASINs to typed rows, no parser to maintain

Two collectors, two shapes of question:

- [`amazon_search`](https://quanticdata.io/collectors/amazon-scraper-api/) — a keyword and a
  marketplace → ranked results with ASIN, title, brand, price, list price, rating, review count,
  sponsored flag, image, delivery line. **$0.001 per product**, up to 200 per run.
- [`amazon_product`](https://quanticdata.io/collectors/amazon-product-api/) — a list of ASINs →
  the detail page fields: availability, seller, delivery, categories, feature bullets.
  **$0.003 per product**, up to 50 per run.

Zero dependencies: Node.js 18+ native `fetch`.

```bash
export QUANTICDATA_API_KEY=qd_live_your_key_here

node search.mjs "running shoes" --country us --max 60 --csv shoes.csv
node products.mjs B0DPHTLDYK B0DT1KPWHP --country us
node track.mjs asins.txt --country us --history prices.csv
```

## Files

| File | What it does |
|---|---|
| [`qd.mjs`](qd.mjs) | 40-line collector client: run, poll, CSV export |
| [`search.mjs`](search.mjs) | keyword → ranked products, with the sponsored share and price spread |
| [`products.mjs`](products.mjs) | ASINs → full detail rows |
| [`track.mjs`](track.mjs) | append today's prices to a CSV and report movers vs. yesterday |
| [`markets.mjs`](markets.mjs) | the same ASIN across marketplaces — `country` switches the Amazon site |

## Search row

```jsonc
{ "rank": 1, "page": 1, "asin": "B0DPHTLDYK", "title": "…", "brand": "Nike",
  "price": "$119.95", "price_value": 119.95, "list_price": "$150.00",
  "rating": 4.5, "reviews": 2841, "sponsored": false,
  "image": "https://…", "url": "https://www.amazon.com/dp/B0DPHTLDYK",
  "delivery": "FREE delivery Wed, Aug 26" }
```

## Product row

Everything above, plus `availability`, `seller`, `categories[]` and `features[]` — the bullet
list from the detail page.

## Notes from production

- **`price_value` is the field you compute on.** `price` keeps Amazon's formatting (currency
  symbol, thousands separators, locale decimal comma); `price_value` is a number.
- **`country` picks the marketplace**, not just the proxy exit: `us` → amazon.com,
  `de` → amazon.de, `co.jp` markets follow the same ISO mapping.
- **Sponsored rows count toward `max_results`.** Filter them out client-side if you are
  measuring organic rank — `search.mjs` prints the share so you know what you paid for.
- Sold-out and regional listings differ per marketplace; the same ASIN can be absent in one
  country and first in another.

## Related

- [Amazon scraper API](https://quanticdata.io/collectors/amazon-scraper-api/) · [Amazon product API](https://quanticdata.io/collectors/amazon-product-api/)
- [Google Shopping API](https://quanticdata.io/collectors/google-shopping-api/) · [Price comparison API](https://quanticdata.io/collectors/price-comparison-api/)
- [Competitor price monitoring](https://quanticdata.io/competitor-price-monitoring/) · [How to price-watch on Amazon](https://quanticdata.io/blog/how-to-price-watch-on-amazon/)

MIT licensed.
