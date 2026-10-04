"""Amazon product API: ASINs in, one typed row per product out.

    pip install requests
    export QUANTICDATA_API_KEY=...        # https://app.quanticdata.io/register
    python3 product.py B0DPHTLDYK B0DT1KPWHP

Docs and schema: https://quanticdata.io/collectors/amazon-product-api/
"""
import os
import sys
import time

import requests

BASE = "https://api.quanticdata.io/v1"
KEY = os.environ.get("QUANTICDATA_API_KEY")
if not KEY:
    sys.exit("Set QUANTICDATA_API_KEY first: https://app.quanticdata.io/register")
HEADERS = {"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}

asins = sys.argv[1:] or ["B0DPHTLDYK"]
payload = {"asins": asins, "country": "us", "max_results": len(asins)}

r = requests.post(f"{BASE}/scraper/collectors/amazon_product/run",
                  headers=HEADERS, json=payload, timeout=180)
body = r.json()
if not r.ok or body.get("type") == "error":
    sys.exit(f"Request failed ({r.status_code}): {body.get('message')}")
run = body["payload"]

# Long runs answer 202 and finish in the background: poll the run until it is done.
while run.get("status") in ("queued", "running"):
    time.sleep(3)
    s = requests.get(f"{BASE}/scraper/collectors/runs/{run['run_id']}",
                     headers=HEADERS, timeout=60)
    run = s.json()["payload"]

rows = run.get("results") or []
for p in rows:
    print(f"{p['asin']}  {p.get('price') or '-':>9}  (list {p.get('list_price') or '-'})  "
          f"{p.get('rating') or '-'} / {p.get('reviews') or 0} reviews  "
          f"{p.get('availability') or '-'}  {p.get('title')}")
print(f"{len(rows)} products")
