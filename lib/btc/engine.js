// lib/btc/engine.js

// ---- utils ----
export function toDate(s) {
  return new Date(`${s}T00:00:00Z`);
}

export function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

export function median(arr) {
  const a = arr.filter(Number.isFinite).slice().sort((x, y) => x - y);
  if (!a.length) return null;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

export function std(arr) {
  const a = arr.filter(Number.isFinite);
  if (a.length < 2) return null;
  const m = a.reduce((s, x) => s + x, 0) / a.length;
  const v = a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1);
  return Math.sqrt(v);
}

export function rolling(arr, lookback, fn) {
  const out = new Array(arr.length).fill(null);
  for (let i = 0; i < arr.length; i++) {
    if (i < lookback) continue;
    const win = arr.slice(i - lookback + 1, i + 1);
    out[i] = fn(win);
  }
  return out;
}

export function sma(values, n) {
  const out = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v)) {
      out[i] = null;
      continue;
    }
    sum += v;
    if (i >= n) sum -= values[i - n];
    if (i >= n - 1) out[i] = sum / n;
  }
  return out;
}

export function logReturns(closes) {
  const out = new Array(closes.length).fill(null);
  for (let i = 1; i < closes.length; i++) {
    const a = closes[i - 1];
    const b = closes[i];
    if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) continue;
    out[i] = Math.log(b / a);
  }
  return out;
}

// ---- series builder ----
export function buildSeries(rows, cfg) {
  // rows: [{date, close}] sorted asc
  const closes = rows.map(r => Number(r.close));
  const dates = rows.map(r => r.date);

  const rets = logReturns(closes);

  // vol = stdev(log returns) over lookback
  const vol = rolling(rets, cfg.volLookback ?? 20, win => std(win));

  // zigzag pct dynamic
  const zigzagPct = vol.map(v => {
    if (!Number.isFinite(v)) return null;
    return clamp((cfg.kZ ?? 3) * v, cfg.minZ ?? 0.08, cfg.maxZ ?? 0.35);
  });

  // trailing stop pct dynamic
  const trailingStopPct = vol.map(v => {
    if (!Number.isFinite(v)) return null;
    const kS = cfg.kS ?? 2.5;
    const bS = cfg.bS ?? 0.02;
    return clamp(kS * v + bS, cfg.minS ?? 0.10, cfg.maxS ?? 0.35);
  });

  const ma200 = sma(closes, cfg.ma200 ?? 200);

  return {
    rows,
    dates,
    closes,
    rets,
    vol,
    zigzagPct,
    trailingStopPct,
    ma200,
  };
}

// ---- Causal ZigZag pivots (supports per-bar pct) ----
// Returns pivots with confirm info.
// "Causal" means: pivot is only known at confirmIdx.
export function zigzagPivotsCausal(series, opts = {}) {
  const { closes, rows, zigzagPct } = series;
  const minBars = opts.minBarsForIndicators ?? 0;

  const pivots = [];
  if (!closes.length) return pivots;

  let trend = null; // "up" or "down"
  let candidateIdx = 0;
  let candidatePrice = closes[0];

  // When trend is up -> candidate is local max
  // When trend is down -> candidate is local min
  for (let i = 1; i < closes.length; i++) {
    if (i < minBars) continue;

    const price = closes[i];
    if (!Number.isFinite(price)) continue;

    const pct = zigzagPct[i];
    if (!Number.isFinite(pct)) continue;

    if (trend === null) {
      // establish trend when move >= pct away from candidate
      const upMove = (price - candidatePrice) / candidatePrice;
      const downMove = (candidatePrice - price) / candidatePrice;
      if (upMove >= pct) {
        trend = "up";
        candidateIdx = i;
        candidatePrice = price;
      } else if (downMove >= pct) {
        trend = "down";
        candidateIdx = i;
        candidatePrice = price;
      } else {
        // keep earliest candidate
        if (price > candidatePrice) {
          // not changing candidate until trend set
          candidateIdx = i;
          candidatePrice = price;
        }
      }
      continue;
    }

    if (trend === "up") {
      if (price >= candidatePrice) {
        candidatePrice = price;
        candidateIdx = i;
        continue;
      }
      // reversal down from candidate by pct confirms a PEAK
      const dd = (candidatePrice - price) / candidatePrice;
      if (dd >= pct) {
        pivots.push({
          idx: candidateIdx,
          date: rows[candidateIdx].date,
          close: candidatePrice,
          type: "peak",
          confirmIdx: i,
          confirmDate: rows[i].date,
          confirmClose: price,
          pctUsed: pct,
        });
        trend = "down";
        candidateIdx = i;
        candidatePrice = price;
      }
    } else {
      if (price <= candidatePrice) {
        candidatePrice = price;
        candidateIdx = i;
        continue;
      }
      // reversal up from candidate by pct confirms a TROUGH
      const uu = (price - candidatePrice) / candidatePrice;
      if (uu >= pct) {
        pivots.push({
          idx: candidateIdx,
          date: rows[candidateIdx].date,
          close: candidatePrice,
          type: "trough",
          confirmIdx: i,
          confirmDate: rows[i].date,
          confirmClose: price,
          pctUsed: pct,
        });
        trend = "up";
        candidateIdx = i;
        candidatePrice = price;
      }
    }
  }

  return pivots;
}

export function findFirstReclaimAfterIdx(series, startIdxExclusive, level) {
  const { closes, rows } = series;
  for (let i = startIdxExclusive + 1; i < closes.length; i++) {
    const c = closes[i];
    if (!Number.isFinite(c)) continue;
    if (c >= level) return { idx: i, date: rows[i].date, close: c };
  }
  return null;
}

export function findMinBetweenIdx(series, startIdxExclusive, endIdxInclusive) {
  const { closes, rows } = series;
  let best = null;
  for (let i = startIdxExclusive + 1; i <= endIdxInclusive; i++) {
    const c = closes[i];
    if (!Number.isFinite(c)) continue;
    if (!best || c < best.close) best = { idx: i, date: rows[i].date, close: c };
  }
  return best;
}

// ---- Epoch cycles (uses reclaim logic, causal peak by default) ----
export function computeEpochCycles(series, epochs, opts = {}) {
  const pivots = zigzagPivotsCausal(series, { minBarsForIndicators: opts.minBarsForIndicators ?? 0 });
  const peaks = pivots.filter(p => p.type === "peak");

  const out = epochs.map(([startStr, endStr]) => {
    const start = toDate(startStr);
    const end = endStr ? toDate(endStr) : null;

    // major peaks inside epoch: choose MAX close
    const peaksInEpoch = peaks.filter(p => {
      const d = toDate(p.date);
      if (d < start) return false;
      if (end && d >= end) return false;
      return true;
    });

    if (!peaksInEpoch.length) {
      return {
        epoch: `${startStr}→${endStr ?? "current"}`,
        start: startStr,
        end: endStr ?? "current",
        cyclePeak: null,
        reclaim: null,
        cycleTrough: null,
        drawdown: null,
        _note: "No confirmed peak pivot found in epoch (increase history or adjust dynamic zigzag bounds).",
      };
    }

    let cyclePeak = peaksInEpoch[0];
    for (const p of peaksInEpoch) if (p.close > cyclePeak.close) cyclePeak = p;

    // For trading truth: peak is only known at confirmIdx, but cycle analysis can reference pivot date.
    // Reclaim search starts AFTER peak date (or after confirmIdx if strictCausalForCycles)
    const strict = !!opts.strictCausalForCycles;
    const peakIdxForSearch = strict ? cyclePeak.confirmIdx : cyclePeak.idx;

    const reclaim = findFirstReclaimAfterIdx(series, peakIdxForSearch, cyclePeak.close);
    const endIdx = reclaim ? reclaim.idx : (series.closes.length - 1);
    const trough = findMinBetweenIdx(series, peakIdxForSearch, endIdx);

    const drawdown = trough ? (trough.close / cyclePeak.close) : null;

    return {
      epoch: `${startStr}→${endStr ?? "current"}`,
      start: startStr,
      end: endStr ?? "current",
      cyclePeak: {
        date: cyclePeak.date,
        close: cyclePeak.close,
        idx: cyclePeak.idx,
        confirmDate: cyclePeak.confirmDate,
        confirmClose: cyclePeak.confirmClose,
        confirmIdx: cyclePeak.confirmIdx,
        pctUsed: cyclePeak.pctUsed,
      },
      reclaim: reclaim ? { date: reclaim.date, close: reclaim.close, idx: reclaim.idx } : null,
      cycleTrough: trough,
      drawdown,
      _note: "Trough = min after peak until price reclaims that peak. Peak is a CAUSAL zigzag pivot (confirmed after reversal).",
    };
  });

  return { pivotsPreview: pivots.slice(0, 60), epochs: out };
}

// ---- Strategy: Reclaim Trend Capture (Long-only) ----
// Entry: when close >= lastConfirmedPeak.close (reclaim) after that peak is confirmed.
// Exit: trailing stop based on highest close since entry.
// Position sizing: posFrac = min(maxPositionFraction, riskPerTrade / stopPctAtEntry)
// Costs: subtract costBpsRoundTrip from gross return (bps in decimal)
export function backtestReclaimTrendCapture(series, params) {
  const {
    useTrendFilter = true,
    costBpsRoundTrip = 10,
    riskPerTrade = 0.01,
    maxPositionFraction = 1,
    cooldownBars = 0,
    volGateMode = null, // "median"
    volGateMultiplier = null,
    volBaseline = null, // passed by walk-forward
    minBarsForIndicators = 260,
    // override dynamic behaviour if you want fixed:
    fixedZigzagPct = null,
    fixedTrailingStopPct = null,
  } = params;

  const { rows, closes, vol, trailingStopPct, ma200, zigzagPct } = series;

  const zPct = fixedZigzagPct != null
    ? zigzagPct.map(() => fixedZigzagPct)
    : zigzagPct;

  const sPct = fixedTrailingStopPct != null
    ? trailingStopPct.map(() => fixedTrailingStopPct)
    : trailingStopPct;

  const pivots = zigzagPivotsCausal(
    { ...series, zigzagPct: zPct },
    { minBarsForIndicators }
  );
  const peakPivots = pivots.filter(p => p.type === "peak").sort((a, b) => a.confirmIdx - b.confirmIdx);

  // baseline vol gating
  const baseline = (volGateMode === "median")
    ? (volBaseline ?? median(vol.filter(v => v != null)))
    : null;

  const threshold = (baseline != null && volGateMultiplier != null)
    ? baseline * volGateMultiplier
    : null;

  let equity = 1.0;
  let peakPtr = 0;
  let lastPeak = null;

  let inPos = false;
  let entryIdx = null;
  let entryPrice = null;
  let entryStopPct = null;
  let highWater = null;
  let stopLevel = null;
  let posFrac = 0;
  let lastExitIdx = -1;

  let maxEquity = 1.0;
  let maxDrawdown = 0;

  const trades = [];

  function updateDD() {
    if (equity > maxEquity) maxEquity = equity;
    const dd = maxEquity > 0 ? (equity / maxEquity - 1) : 0;
    if (dd < maxDrawdown) maxDrawdown = dd;
  }

  const costDec = costBpsRoundTrip / 10000;

  for (let i = 0; i < closes.length; i++) {
    const price = closes[i];
    if (!Number.isFinite(price)) continue;

    // update lastPeak as peaks get confirmed
    while (peakPtr < peakPivots.length && peakPivots[peakPtr].confirmIdx <= i) {
      lastPeak = peakPivots[peakPtr];
      peakPtr++;
    }

    if (i < minBarsForIndicators) continue;

    // manage open position
    if (inPos) {
      highWater = Math.max(highWater, price);
      const sp = Number.isFinite(sPct[i]) ? sPct[i] : entryStopPct;
      stopLevel = highWater * (1 - sp);

      if (price <= stopLevel) {
        const exitPrice = price;
        const gross = exitPrice / entryPrice - 1;
        const net = gross - costDec;
        const pnlFrac = posFrac * net;

        equity = equity * (1 + pnlFrac);
        updateDD();

        trades.push({
          entryDate: rows[entryIdx].date,
          exitDate: rows[i].date,
          entry: entryPrice,
          exit: exitPrice,
          bars: i - entryIdx,
          posFrac,
          pnlFrac,
          reason: "trailingStop",
        });

        inPos = false;
        lastExitIdx = i;
        entryIdx = null;
        entryPrice = null;
        entryStopPct = null;
        highWater = null;
        stopLevel = null;
        posFrac = 0;
      }
      continue;
    }

    // not in position: check cooldown
    if (cooldownBars > 0 && lastExitIdx >= 0 && (i - lastExitIdx) < cooldownBars) continue;

    // need a lastPeak and it must be confirmed already (we only set it after confirmIdx)
    if (!lastPeak) continue;

    // trend filter: require close above MA200
    if (useTrendFilter) {
      const m = ma200[i];
      if (!Number.isFinite(m) || price < m) continue;
    }

    // volatility gate (data-driven via optimizer)
    if (threshold != null) {
      const v = vol[i];
      if (!Number.isFinite(v)) continue;
      // gate means: only trade when vol is NOT extreme
      if (v > threshold) continue;
    }

    // ENTRY CONDITION: reclaim last confirmed peak close
    if (price >= lastPeak.close) {
      const stopPctAtEntry = Number.isFinite(sPct[i]) ? sPct[i] : (params.trailingStopPct ?? 0.12);
      const pf = clamp(riskPerTrade / stopPctAtEntry, 0, maxPositionFraction);

      inPos = true;
      entryIdx = i;
      entryPrice = price;
      entryStopPct = stopPctAtEntry;
      highWater = price;
      stopLevel = price * (1 - stopPctAtEntry);
      posFrac = pf;
    }
  }

  // close at end if still open
  if (inPos && entryIdx != null) {
    const i = closes.length - 1;
    const exitPrice = closes[i];
    if (Number.isFinite(exitPrice)) {
      const gross = exitPrice / entryPrice - 1;
      const net = gross - costDec;
      const pnlFrac = posFrac * net;
      equity = equity * (1 + pnlFrac);
      updateDD();
      trades.push({
        entryDate: rows[entryIdx].date,
        exitDate: rows[i].date,
        entry: entryPrice,
        exit: exitPrice,
        bars: i - entryIdx,
        posFrac,
        pnlFrac,
        reason: "endOfSlice",
      });
    }
  }

  // win/loss metrics
  const wins = trades.filter(t => t.pnlFrac > 0).length;
  const losses = trades.filter(t => t.pnlFrac < 0).length;
  const sumWin = trades.filter(t => t.pnlFrac > 0).reduce((s, t) => s + t.pnlFrac, 0);
  const sumLossAbs = Math.abs(trades.filter(t => t.pnlFrac < 0).reduce((s, t) => s + t.pnlFrac, 0));
  const profitFactor = sumLossAbs > 0 ? (sumWin / sumLossAbs) : (wins > 0 ? null : 0);

  const avgPnLPerTrade = trades.length
    ? trades.reduce((s, t) => s + t.pnlFrac, 0) / trades.length
    : 0;

  const avgBarsHeld = trades.length
    ? trades.reduce((s, t) => s + t.bars, 0) / trades.length
    : 0;

  return {
    trades,
    stats: {
      trades: trades.length,
      wins,
      losses,
      winRate: trades.length ? wins / trades.length : 0,
      avgPnLPerTrade,
      profitFactor,
      avgBarsHeld,
      maxDrawdown, // negative number
      endingEquity: equity,
    },
    debug: {
      volBaseline: baseline,
      volThreshold: threshold,
    },
  };
}

// ---- Walk-forward optimizer ----
export function walkForward(series, cfg) {
  const {
    trainBars = 730,
    testBars = 180,
    minBarsForIndicators = 260,
    ma200 = 200,
    costBpsRoundTrip = 10,
    riskPerTrade = 0.01,
    maxPositionFraction = 1,

    // search spaces
    zigzagPctList = [0.08, 0.12, 0.2], // used as FIXED overrides optionally
    trailingStopPctList = [0.12, 0.15, 0.2],
    useTrendFilterList = [true, false],
    cooldownBarsList = [0, 10, 20, 30],
    volGateModeList = ["median"],
    volGateMultiplierList = [1.25, 1.5, 2],

    // constraints (DATA decides by optimization, but you can enforce safety)
    maxAllowedDrawdown = -0.35, // equity drop of 35% from peak (negative)
    minTradesTrain = 3,
  } = cfg;

  const N = series.closes.length;
  const windows = [];

  // start after warmup
  let trainStart = minBarsForIndicators;
  while (trainStart + trainBars + testBars <= N) {
    const trainEnd = trainStart + trainBars; // exclusive
    const testStart = trainEnd;
    const testEnd = testStart + testBars; // exclusive

    const trainSlice = sliceSeries(series, trainStart, trainEnd);
    const testSlice = sliceSeries(series, testStart, testEnd);

    // baseline vol computed from train
    const volBaseline = median(trainSlice.vol.filter(v => v != null));

    let best = null;

    for (const zz of zigzagPctList) {
      for (const st of trailingStopPctList) {
        for (const tf of useTrendFilterList) {
          for (const cd of cooldownBarsList) {
            for (const vMode of volGateModeList) {
              for (const vMult of volGateMultiplierList) {

                const trainRes = backtestReclaimTrendCapture(trainSlice, {
                  useTrendFilter: tf,
                  cooldownBars: cd,
                  volGateMode: vMode,
                  volGateMultiplier: vMult,
                  volBaseline,
                  ma200,
                  minBarsForIndicators: 0, // already sliced past warmup
                  costBpsRoundTrip,
                  riskPerTrade,
                  maxPositionFraction,
                  fixedZigzagPct: zz, // search uses fixed; dynamic already baked in series if you want to widen later
                  fixedTrailingStopPct: st,
                });

                if (trainRes.stats.trades < minTradesTrain) continue;
                if (trainRes.stats.maxDrawdown < maxAllowedDrawdown) continue;

                const score = trainRes.stats.endingEquity;

                if (!best || score > best.score) {
                  best = {
                    score,
                    chosen: { zigzagPct: zz, trailingStopPct: st, useTrendFilter: tf, cooldownBars: cd, volGateMultiplier: vMult, volGateMode: vMode, ma200, volLookback: cfg.volLookback ?? 20, riskPerTrade, maxPositionFraction, costBpsRoundTrip },
                    trainRes,
                  };
                }
              }
            }
          }
        }
      }
    }

    // if no best found, still record window
    let chosen = best?.chosen ?? null;

    // test run with chosen
    let testRes = null;
    let testVol = null;

    if (chosen) {
      testRes = backtestReclaimTrendCapture(testSlice, {
        useTrendFilter: chosen.useTrendFilter,
        cooldownBars: chosen.cooldownBars,
        volGateMode: chosen.volGateMode,
        volGateMultiplier: chosen.volGateMultiplier,
        volBaseline,
        ma200,
        minBarsForIndicators: 0,
        costBpsRoundTrip,
        riskPerTrade,
        maxPositionFraction,
        fixedZigzagPct: chosen.zigzagPct,
        fixedTrailingStopPct: chosen.trailingStopPct,
      });

      testVol = {
        baseline: volBaseline,
        threshold: (volBaseline != null && chosen.volGateMultiplier != null) ? volBaseline * chosen.volGateMultiplier : null,
      };
    } else {
      testRes = {
        trades: [],
        stats: { trades: 0, wins: 0, losses: 0, winRate: 0, avgPnLPerTrade: 0, profitFactor: 0, avgBarsHeld: 0, maxDrawdown: 0, endingEquity: 1 },
      };
      testVol = { baseline: volBaseline, threshold: null };
    }

    windows.push({
      window: {
        train: [trainSlice.rows[0]?.date, trainSlice.rows[trainSlice.rows.length - 1]?.date],
        test: [testSlice.rows[0]?.date, testSlice.rows[testSlice.rows.length - 1]?.date],
      },
      chosen,
      trainStats: best?.trainRes?.stats ?? { trades: 0, endingEquity: 1, maxDrawdown: 0 },
      testStats: testRes.stats,
      testVol,
      _idx: { trainStart, trainEnd, testStart, testEnd },
      _chosenTrainScore: best?.score ?? null,
    });

    // slide forward by test window
    trainStart = testStart;
  }

  // aggregate OOS
  const oosTrades = [];
  let oosEquity = 1;
  let oosMaxEquity = 1;
  let oosMaxDD = 0;

  for (const w of windows) {
    if (!w.chosen) continue;

    // rebuild test slice to attach window idx metadata to each trade
    const testSlice = sliceSeries(series, w._idx.testStart, w._idx.testEnd);
    const volBaseline = median(sliceSeries(series, w._idx.trainStart, w._idx.trainEnd).vol.filter(v => v != null));

    const res = backtestReclaimTrendCapture(testSlice, {
      useTrendFilter: w.chosen.useTrendFilter,
      cooldownBars: w.chosen.cooldownBars,
      volGateMode: w.chosen.volGateMode,
      volGateMultiplier: w.chosen.volGateMultiplier,
      volBaseline,
      ma200,
      minBarsForIndicators: 0,
      costBpsRoundTrip,
      riskPerTrade,
      maxPositionFraction,
      fixedZigzagPct: w.chosen.zigzagPct,
      fixedTrailingStopPct: w.chosen.trailingStopPct,
    });

    for (const t of res.trades) {
      // compound equity in same way
      oosEquity *= (1 + t.pnlFrac);
      if (oosEquity > oosMaxEquity) oosMaxEquity = oosEquity;
      const dd = oosEquity / oosMaxEquity - 1;
      if (dd < oosMaxDD) oosMaxDD = dd;

      oosTrades.push({
        ...t,
        window: {
          trainStart: w._idx.trainStart,
          trainEnd: w._idx.trainEnd,
          testStart: w._idx.testStart,
          testEnd: w._idx.testEnd,
        },
      });
    }
  }

  const wins = oosTrades.filter(t => t.pnlFrac > 0).length;
  const losses = oosTrades.filter(t => t.pnlFrac < 0).length;
  const sumWin = oosTrades.filter(t => t.pnlFrac > 0).reduce((s, t) => s + t.pnlFrac, 0);
  const sumLossAbs = Math.abs(oosTrades.filter(t => t.pnlFrac < 0).reduce((s, t) => s + t.pnlFrac, 0));
  const profitFactor = sumLossAbs > 0 ? (sumWin / sumLossAbs) : (wins > 0 ? null : 0);

  const avgPnLPerTrade = oosTrades.length ? oosTrades.reduce((s, t) => s + t.pnlFrac, 0) / oosTrades.length : 0;
  const avgBarsHeld = oosTrades.length ? oosTrades.reduce((s, t) => s + t.bars, 0) / oosTrades.length : 0;

  return {
    windows: windows.map(w => ({
      window: w.window,
      chosen: w.chosen,
      trainStats: w.trainStats,
      testStats: w.testStats,
      testVol: w.testVol,
    })),
    overallOutOfSample: {
      trades: oosTrades.length,
      wins,
      losses,
      winRate: oosTrades.length ? wins / oosTrades.length : 0,
      avgPnLPerTrade,
      profitFactor,
      avgBarsHeld,
      maxDrawdown: oosMaxDD,
      endingEquity: oosEquity,
    },
    outOfSampleTrades: oosTrades,
  };
}

export function sliceSeries(series, startIdx, endIdxExclusive) {
  const rows = series.rows.slice(startIdx, endIdxExclusive);
  const closes = series.closes.slice(startIdx, endIdxExclusive);
  const vol = series.vol.slice(startIdx, endIdxExclusive);
  const zigzagPct = series.zigzagPct.slice(startIdx, endIdxExclusive);
  const trailingStopPct = series.trailingStopPct.slice(startIdx, endIdxExclusive);
  const ma200 = series.ma200.slice(startIdx, endIdxExclusive);
  const rets = series.rets.slice(startIdx, endIdxExclusive);

  return { rows, closes, vol, zigzagPct, trailingStopPct, ma200, rets, dates: rows.map(r => r.date) };
}
