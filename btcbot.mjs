import "dotenv/config";

// If your Node already supports global fetch (Node 18+), you're good.
// If not, run: npm i node-fetch
// and uncomment these lines:
// import fetch from "node-fetch";
// globalThis.fetch = fetch;

const API_KEY = process.env.TWELVE_DATA_API_KEY;
if (!API_KEY) {
  console.error("Missing TWELVE_DATA_API_KEY. Put it in .env.local or environment.");
  process.exit(1);
}

const SYMBOL = "BTC/USD";
const INTERVAL = "1day";
const OUTPUTSIZE = 5000; // enough for ~13+ years daily
const ZIGZAG_RUNS = [0.08, 0.12, 0.20];

const HALVINGS = [
  ["2012-11-28", "2016-07-09"],
  ["2016-07-09", "2020-05-11"],
  ["2020-05-11", "2024-04-20"],
  ["2024-04-20", null],
];

function toDate(s) {
  return new Date(`${s}T00:00:00Z`);
}

function zigzag(prices, pct) {
  const pivots = [];
  let lastPrice = prices[0];
  let trend = null;
  let candidatePrice = prices[0];
  let candidateIdx = 0;

  for (let i = 1; i < prices.length; i++) {
    const price = prices[i];

    if (trend === null) {
      const upMove = (price - lastPrice) / lastPrice;
      const downMove = (lastPrice - price) / lastPrice;
      if (upMove >= pct) {
        trend = "up";
        candidatePrice = price;
        candidateIdx = i;
      } else if (downMove >= pct) {
        trend = "down";
        candidatePrice = price;
        candidateIdx = i;
      }
      continue;
    }

    if (trend === "up") {
      if (price >= candidatePrice) {
        candidatePrice = price;
        candidateIdx = i;
      } else if ((candidatePrice - price) / candidatePrice >= pct) {
        pivots.push({ idx: candidateIdx, price: candidatePrice, type: "peak" });
        trend = "down";
        candidatePrice = price;
        candidateIdx = i;
      }
    } else {
      if (price <= candidatePrice) {
        candidatePrice = price;
        candidateIdx = i;
      } else if ((price - candidatePrice) / candidatePrice >= pct) {
        pivots.push({ idx: candidateIdx, price: candidatePrice, type: "trough" });
        trend = "up";
        candidatePrice = price;
        candidateIdx = i;
      }
    }
  }
  return pivots;
}

function sliceEpoch(rows, startStr, endStr) {
  const start = toDate(startStr);
  const end = endStr ? toDate(endStr) : null;
  return rows.filter(r => {
    const d = r.date;
    if (d < start) return false;
    if (end && d >= end) return false;
    return true;
  });
}

function summarizeEpoch(rows, pct) {
  if (rows.length < 200) return null;

  const prices = rows.map(r => r.close);
  const piv = zigzag(prices, pct);
  if (piv.length < 2) return null;

  const peaks = piv.filter(p => p.type === "peak").map(p => p.price);
  const troughs = piv.filter(p => p.type === "trough").map(p => p.price);

  const peakMult = [];
  for (let i = 1; i < peaks.length; i++) peakMult.push(peaks[i] / peaks[i - 1]);

  const troughMult = [];
  for (let i = 1; i < troughs.length; i++) troughMult.push(troughs[i] / troughs[i - 1]);

  const firstPivots = piv.slice(0, 8).map(p => ({
    date: rows[p.idx]?.date?.toISOString().slice(0, 10),
    type: p.type,
    price: Number(p.price.toFixed(2)),
  }));

  return { pivots: piv.length, peaks: peaks.length, troughs: troughs.length, peakMult, troughMult, firstPivots };
}

async function fetchBTC() {
  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", SYMBOL);
  url.searchParams.set("interval", INTERVAL);
  url.searchParams.set("outputsize", String(OUTPUTSIZE));
  url.searchParams.set("apikey", API_KEY);

  const res = await fetch(url.toString());
  const data = await res.json();

  if (!res.ok || data.status === "error") {
    throw new Error(`TwelveData error: ${JSON.stringify(data).slice(0, 300)}`);
  }

  // data.values newest-first
  const rows = data.values
    .map(v => ({
      date: new Date(v.datetime + "T00:00:00Z"),
      close: Number(v.close),
    }))
    .filter(r => Number.isFinite(r.close))
    .sort((a, b) => a.date - b.date);

  return rows;
}

async function main() {
  console.log("Fetching BTC daily data from Twelve Data…");
  const rows = await fetchBTC();
  console.log(`Loaded ${rows.length} rows (${rows[0].date.toISOString().slice(0,10)} → ${rows[rows.length-1].date.toISOString().slice(0,10)})`);

  for (const pct of ZIGZAG_RUNS) {
    console.log("\n" + "=".repeat(72));
    console.log(`ZIGZAG_PCT = ${pct.toFixed(2)}`);
    console.log("=".repeat(72));

    for (const [start, end] of HALVINGS) {
      const edf = sliceEpoch(rows, start, end);
      const res = summarizeEpoch(edf, pct);
      if (!res) continue;

      console.log(`\n--- EPOCH ${start} → ${end ?? "current"} ---`);
      console.log(`pivots: ${res.pivots} | peaks: ${res.peaks} | troughs: ${res.troughs}`);
      console.log("peak→peak multipliers:", res.peakMult.map(x => Number(x.toFixed(3))));
      console.log("trough→trough multipliers:", res.troughMult.map(x => Number(x.toFixed(3))));
      console.log("first pivots:", res.firstPivots);
    }
  }
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
