/** Minimal QuanticData Collectors client — Node 18+, no dependencies. */
const BASE = "https://api.quanticdata.io/v1";

function headers() {
  const key = process.env.QUANTICDATA_API_KEY;
  if (!key) {
    console.error("set QUANTICDATA_API_KEY — https://app.quanticdata.io/register");
    process.exit(1);
  }
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

async function unwrap(res, what) {
  const body = await res.json();
  if (!res.ok || body.type === "error") {
    throw new Error(`${what} failed (${res.status}): ${body.message}`);
  }
  return body.payload ?? {};
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Run a collector and return its rows, waiting out an async run. */
export async function collect(slug, input) {
  let run = await unwrap(
    await fetch(`${BASE}/scraper/collectors/${slug}/run`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(input),
    }),
    slug,
  );

  while (run.status === "queued" || run.status === "running") {
    await sleep(3000);
    run = await unwrap(
      await fetch(`${BASE}/scraper/collectors/runs/${run.run_id}`, { headers: headers() }),
      "run status",
    );
  }
  if (run.partial) console.error(`  (partial run: ${(run.notes ?? []).join("; ")})`);
  return run.results ?? [];
}

/** Rows -> CSV text. Columns come from the first row unless you pass them. */
export function toCsv(rows, columns) {
  const cols = columns ?? [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const cell = (v) => {
    const s = Array.isArray(v) ? v.join(" | ") : v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n") + "\n";
}
