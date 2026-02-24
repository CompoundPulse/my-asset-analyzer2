// app/api/btc-history/route.js
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Returns:
 *   { rows: [{ date:"YYYY-MM-DD", close:number }, ...], meta:{...} }
 *
 * Source (robust):
 *   Stooq CSV: https://stooq.com/q/d/l/?s=btcusd&i=d
 *
 * Why:
 *   Your /api/crypto is currently broken (KuCoin invalid response).
 *   We must not depend on it for historical data.
 */

function parseStooqCSV(csvText) {
  // Stooq CSV format:
  // Date,Open,High,Low,Close,Volume
  // 2010-07-17,0.04951,0.08584,0.04951,0.08584,0
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].trim().toLowerCase();
  if (!header.startsWith("date,")) return [];

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",");
    if (parts.length < 5) continue;

    const date = (parts[0] || "").slice(0, 10);
    const close = Number(parts[4]);

    if (date && date.length === 10 && Number.isFinite(close)) {
      rows.push({ date, close });
    }
  }

  // ensure ascending
  rows.sort((a, b) => (a.date < b.date ? -1 : 1));
  return rows;
}

async function fetchText(url) {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}. Body starts: ${text.slice(0, 200)}`);
  }
  return text;
}

export async function GET(request) {
  try {
    const stooqUrl = "https://stooq.com/q/d/l/?s=btcusd&i=d";

    const csv = await fetchText(stooqUrl);
    const rows = parseStooqCSV(csv);

    if (!rows.length) {
      return NextResponse.json(
        {
          error: "btc-history got empty/invalid CSV from Stooq",
          hint: "Check if Stooq is reachable from your machine/network. Try opening the URL in a browser.",
          source: stooqUrl,
          csvHead: csv.slice(0, 200),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      rows,
      meta: {
        source: "stooq:btcusd:daily",
        url: stooqUrl,
        rows: rows.length,
        dateRange: [rows[0].date, rows[rows.length - 1].date],
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "btc-history crashed",
        message: err?.message ?? String(err),
        howToFix: [
          "1) Confirm you have internet access from the Next dev server environment.",
          "2) Open https://stooq.com/q/d/l/?s=btcusd&i=d in your browser. If blocked, use a VPN or alternate source.",
          "3) If you want NO internet dependency, I can change this to read a local JSON file you drop into /data.",
        ],
      },
      { status: 500 }
    );
  }
}
