// app/api/btc/route.js
import { NextResponse } from "next/server";

import {
  buildSeries,
  computeEpochCycles,
  backtestReclaimTrendCapture,
  walkForward,
} from "@/lib/btc/engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ✅ CHANGE THIS to the REAL history route you have right now.
// You currently DO NOT have /api/btc-history (it's 404).
// Example guesses (pick the one that exists):
//   "/api/btc-history"
//   "/api/crypto/btc-history"
//   "/api/crypto?symbol=BTC"
//   "/api/btc"  (if you previously made a btc-history route elsewhere)
// Run: `ls app/api` to confirm names.
const HIST_PATH = "/api/btc-history";

const DEFAULT_EPOCHS = [
  ["2009-01-03", "2012-11-28"],
  ["2012-11-28", "2016-07-09"],
  ["2016-07-09", "2020-05-11"],
  ["2020-05-11", "2024-04-20"],
  ["2024-04-20", null],
];

function num(qs, key, fallback) {
  const v = qs.get(key);
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(qs, key, fallback) {
  const v = qs.get(key);
  if (v == null) return fallback;
  if (v === "1" || v === "true") return true;
  if (v === "0" || v === "false") return false;
  return fallback;
}

function listNums(qs, key, fallbackArr) {
  const v = qs.get(key);
  if (!v) return fallbackArr;
  const arr = v
    .split(",")
    .map((x) => Number(x.trim()))
    .filter(Number.isFinite);
  return arr.length ? arr : fallbackArr;
}

async function fetchHistory(request) {
  const histUrl = new URL(HIST_PATH, request.url);
  const res = await fetch(histUrl, { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `History fetch failed: ${HIST_PATH} -> HTTP ${res.status}. Body starts: ${text.slice(
        0,
        120
      )}`
    );
  }

  // If this isn't JSON, it will throw, and the outer try/catch will return a good error.
  const json = await res.json();

  if (!json?.rows || !Array.isArray(json.rows) || json.rows.length === 0) {
    throw new Error(
      `History JSON shape invalid. Expected { rows: [...] }. Got keys: ${Object.keys(
        json || {}
      ).join(", ")}`
    );
  }

  return json.rows;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const qs = url.searchParams;

    // modes: cycles | backtest | walkforward | pivots
    const mode = qs.get("mode") ?? "cycles";

    // --- base config (series) ---
    const volLookback = num(qs, "volLookback", 20);

    // Dynamic zigzag pct = clamp(kZ*vol, minZ, maxZ)
    const kZ = num(qs, "kZ", 3);
    const minZ = num(qs, "minZ", 0.08);
    const maxZ = num(qs, "maxZ", 0.35);

    // Dynamic trailing stop = clamp(kS*vol + bS, minS, maxS)
    const kS = num(qs, "kS", 2.5);
    const bS = num(qs, "bS", 0.02);
    const minS = num(qs, "minS", 0.10);
    const maxS = num(qs, "maxS", 0.35);

    const ma200 = num(qs, "ma200", 200);

    const minBarsForIndicators = num(qs, "minBarsForIndicators", 260);
    const costBpsRoundTrip = num(qs, "costBpsRoundTrip", 10);

    // ✅ fetch history from your existing endpoint
    const histRows = await fetchHistory(request);

    const rows = histRows
      .map((r) => ({ date: r.date, close: Number(r.close) }))
      .filter((r) => r?.date && Number.isFinite(r.close))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    if (!rows.length) {
      return NextResponse.json(
        { error: "No usable rows after parsing history", sample: histRows?.[0] },
        { status: 500 }
      );
    }

    const series = buildSeries(rows, {
      volLookback,
      kZ,
      minZ,
      maxZ,
      kS,
      bS,
      minS,
      maxS,
      ma200,
    });

    const header = {
      params: {
        volLookback,
        kZ,
        minZ,
        maxZ,
        kS,
        bS,
        minS,
        maxS,
        ma200,
        minBarsForIndicators,
        costBpsRoundTrip,
        MAJOR_ZIGZAG_PCT:
          "dynamic: zigzagPct(t)=clamp(kZ*vol, minZ, maxZ)",
        trailingStopPct:
          "dynamic: stopPct(t)=clamp(kS*vol + bS, minS, maxS)",
      },
      historySource: HIST_PATH,
      rows: rows.length,
      dateRange: [rows[0].date, rows[rows.length - 1].date],
    };

    // ---- mode: pivots ----
    if (mode === "pivots") {
      const { pivotsPreview } = computeEpochCycles(series, DEFAULT_EPOCHS, {
        minBarsForIndicators,
      });

      return NextResponse.json({
        ...header,
        pivotsPreview,
        seriesPreview: series.rows.slice(0, 60).map((r, i) => ({
          date: r.date,
          close: series.closes[i],
          vol: series.vol[i],
          zigzagPct: series.zigzagPct[i],
          trailingStopPct: series.trailingStopPct[i],
          ma200: series.ma200[i],
        })),
      });
    }

    // ---- mode: cycles ----
    if (mode === "cycles") {
      const { pivotsPreview, epochs } = computeEpochCycles(
        series,
        DEFAULT_EPOCHS,
        { minBarsForIndicators }
      );

      return NextResponse.json({
        ...header,
        pivotsPreview,
        epochs,
      });
    }

    // ---- mode: backtest ----
    if (mode === "backtest") {
      const useTrendFilter = bool(qs, "useTrendFilter", true);
      const cooldownBars = num(qs, "cooldownBars", 0);
      const riskPerTrade = num(qs, "riskPerTrade", 0.01);
      const maxPositionFraction = num(qs, "maxPositionFraction", 1);

      const useVolGate = bool(qs, "useVolGate", false);
      const volGateMode = useVolGate ? qs.get("volGateMode") ?? "median" : null;
      const volGateMultiplier = useVolGate
        ? num(qs, "volGateMultiplier", 1.5)
        : null;

      const fixedZigzagPct = qs.get("fixedZigzagPct")
        ? num(qs, "fixedZigzagPct", null)
        : null;

      const fixedTrailingStopPct = qs.get("fixedTrailingStopPct")
        ? num(qs, "fixedTrailingStopPct", null)
        : null;

      const res = backtestReclaimTrendCapture(series, {
        useTrendFilter,
        cooldownBars,
        volGateMode,
        volGateMultiplier,
        ma200,
        minBarsForIndicators,
        costBpsRoundTrip,
        riskPerTrade,
        maxPositionFraction,
        fixedZigzagPct,
        fixedTrailingStopPct,
      });

      return NextResponse.json({
        ...header,
        strategy: "Reclaim Trend Capture (Long-only)",
        params: {
          useTrendFilter,
          cooldownBars,
          riskPerTrade,
          maxPositionFraction,
          useVolGate,
          volGateMode,
          volGateMultiplier,
          fixedZigzagPct,
          fixedTrailingStopPct,
        },
        stats: res.stats,
        debug: res.debug,
        trades: res.trades,
      });
    }

    // ---- mode: walkforward ----
    if (mode === "walkforward") {
      const trainBars = num(qs, "trainBars", 730);
      const testBars = num(qs, "testBars", 180);

      const zigzagPctList = listNums(qs, "zigzagPctList", [0.08, 0.12, 0.2]);
      const trailingStopPctList = listNums(qs, "trailingStopPctList", [
        0.12, 0.15, 0.2,
      ]);
      const cooldownBarsList = listNums(qs, "cooldownBarsList", [
        0, 10, 20, 30,
      ]);

      const useTrendFilterList = (qs.get("useTrendFilterList") ?? "true,false")
        .split(",")
        .map((s) => s.trim())
        .map((s) => (s === "true" ? true : s === "false" ? false : null))
        .filter((v) => v !== null);

      const volGateMultiplierList = listNums(qs, "volGateMultiplierList", [
        1.25, 1.5, 2,
      ]);
      const volGateModeList = (qs.get("volGateModeList") ?? "median")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const riskPerTrade = num(qs, "riskPerTrade", 0.01);
      const maxPositionFraction = num(qs, "maxPositionFraction", 1);

      const maxAllowedDrawdown = num(qs, "maxAllowedDrawdown", -0.35);
      const minTradesTrain = num(qs, "minTradesTrain", 3);

      const wf = walkForward(series, {
        volLookback,
        trainBars,
        testBars,
        minBarsForIndicators,
        ma200,
        costBpsRoundTrip,
        riskPerTrade,
        maxPositionFraction,

        zigzagPctList,
        trailingStopPctList,
        useTrendFilterList,
        cooldownBarsList,
        volGateModeList,
        volGateMultiplierList,

        maxAllowedDrawdown,
        minTradesTrain,
      });

      return NextResponse.json({
        ...header,
        strategy: "Reclaim Trend Capture (Long-only) — Walk-forward validated",
        defaults: {
          zigzagPctList,
          trailingStopPctList,
          useTrendFilterList,
          cooldownBarsList,
          volLookback,
          ma200,
          riskPerTrade,
          maxPositionFraction,
          minBarsForIndicators,
          costBpsRoundTrip,
          trainBars,
          testBars,
          volGateModeList,
          volGateMultiplierList,
          maxAllowedDrawdown,
          minTradesTrain,
        },
        ...wf,
      });
    }

    return NextResponse.json(
      {
        ...header,
        error: `Unknown mode: ${mode}`,
        hint: "Use ?mode=cycles | pivots | backtest | walkforward",
      },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "btc api crashed",
        message: err?.message ?? String(err),
        hint:
          "Your history endpoint is missing or not returning {rows:[{date,close}]}",
      },
      { status: 500 }
    );
  }
}
