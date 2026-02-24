'use client';
import React, { useEffect, useRef, useCallback } from 'react';

/**
 * TVPatternChart — Lightweight Charts v5 for pattern detector charts
 *
 * Handles all annotation types used across pattern detectors:
 *   - priceLines:   [{ value, color, label, dashed? }]        → horizontal lines
 *   - slopeLines:   [{ points:[{time,value},...], color, dashed? }] → trend lines
 *   - markers:      [{ time, label, color, position?:'above'|'below' }] → point markers
 *   - verticalLines:[{ time, color, label }]                  → vertical markers
 *
 * Props:
 *   data         — [{ date: string, value: number }]
 *   title        — string
 *   symbol       — string
 *   height       — number (default 320)
 *   priceLines   — array of horizontal annotation lines
 *   slopeLines   — array of slope/trend line series
 *   markers      — array of point markers
 *   verticalLines— array of vertical line markers
 *   extraSeries  — array of { data:[{date,value}], color, name, dashed? } (MAs etc.)
 */
const TVPatternChart = ({
  data = [],
  title,
  symbol,
  height = 320,
  priceLines = [],
  slopeLines = [],
  markers = [],
  verticalLines = [],
  extraSeries = [],
}) => {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const cleanupRef   = useRef([]);
  const resizeObRef  = useRef(null);

  // Normalize { date, value } → { time: 'YYYY-MM-DD', value }
  const normalize = useCallback((raw) => {
    if (!raw?.length) return [];
    return raw
      .map(p => {
        if (!p) return null;
        let time = typeof p.date === 'string' ? p.date.slice(0, 10)
                 : typeof p.time === 'string' ? p.time.slice(0, 10)
                 : typeof p.date === 'number' ? new Date(p.date).toISOString().slice(0, 10)
                 : null;
        const value = parseFloat(p.value ?? p.close ?? p.price);
        if (!time || isNaN(value)) return null;
        return { time, value };
      })
      .filter(Boolean)
      .sort((a, b) => a.time < b.time ? -1 : 1)
      .filter((p, i, arr) => i === 0 || p.time !== arr[i - 1].time);
  }, []);

  // Normalize marker times to YYYY-MM-DD
  const normalizeTime = (t) => {
    if (typeof t === 'string') return t.slice(0, 10);
    if (typeof t === 'number') return new Date(t).toISOString().slice(0, 10);
    return null;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    cleanupRef.current = [];

    const init = async () => {
      const lc = await import('lightweight-charts');
      const { createChart, LineSeries, CrosshairMode, createSeriesMarkers } = lc;
      if (cancelled || !containerRef.current) return;

      const el = containerRef.current;

      const chart = createChart(el, {
        width:  el.clientWidth,
        height,
        layout: {
          background:  { color: '#1E222D' },
          textColor:   '#787B86',
          fontFamily:  '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, sans-serif',
          fontSize:    11,
        },
        grid: {
          vertLines: { color: '#2A2E39' },
          horzLines: { color: '#2A2E39' },
        },
        crosshair: {
          mode: CrosshairMode?.Normal ?? 1,
          vertLine: { color: '#758696', width: 1, style: 1, labelBackgroundColor: '#2962FF' },
          horzLine: { color: '#758696', width: 1, style: 1, labelBackgroundColor: '#2962FF' },
        },
        rightPriceScale: {
          borderColor:  '#2A2E39',
          scaleMargins: { top: 0.12, bottom: 0.1 },
        },
        timeScale: {
          borderColor:           '#2A2E39',
          timeVisible:           true,
          secondsVisible:        false,
          rightBarStaysOnScroll: true,
        },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
        handleScale:  { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
      });

      chartRef.current = chart;
      cleanupRef.current.push(() => chart.remove());

      // ── Main price series ──────────────────────────────────────────────
      const mainSeries = chart.addSeries(LineSeries, {
        color:      '#2962FF',
        lineWidth:  2,
        crosshairMarkerVisible:         true,
        crosshairMarkerRadius:          4,
        crosshairMarkerBorderColor:     '#2962FF',
        crosshairMarkerBackgroundColor: '#1E222D',
        priceFormat: {
          type:      'custom',
          formatter: (v) => `$${v >= 1000 ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : v.toFixed(2)}`,
        },
      });

      const normalizedData = normalize(data);
      if (normalizedData.length > 0) {
        mainSeries.setData(normalizedData);
      }

      // ── Horizontal price lines (support/resistance/targets/fib) ────────
      priceLines.forEach(pl => {
        if (pl.value == null || isNaN(pl.value)) return;
        mainSeries.createPriceLine({
          price:      pl.value,
          color:      pl.color || '#787B86',
          lineWidth:  pl.width || 1,
          lineStyle:  pl.dashed !== false ? 2 : 0, // 2=dashed, 0=solid
          axisLabelVisible: true,
          title:      pl.label || '',
        });
      });

      // ── Slope / trend lines (wedge bounds, necklines, etc.) ────────────
      slopeLines.forEach(sl => {
        if (!sl.points?.length) return;
        const normalized = normalize(sl.points);
        if (normalized.length < 2) return;
        const slopeSeries = chart.addSeries(LineSeries, {
          color:                  sl.color || '#FF9800',
          lineWidth:              sl.width || 1.5,
          lineStyle:              sl.dashed !== false ? 2 : 0,
          crosshairMarkerVisible: false,
          lastValueVisible:       false,
          priceLineVisible:       false,
          // Use same price scale as main series so lines align, but suppress label
          priceScaleId:           'right',
          autoscaleInfoProvider:  () => null, // don't influence autoscale
        });
        slopeSeries.setData(normalized);
      });

      // ── Extra series (Moving averages, etc.) ───────────────────────────
      extraSeries.forEach(es => {
        if (!es.data?.length) return;
        const normalized = normalize(es.data);
        if (!normalized.length) return;
        const s = chart.addSeries(LineSeries, {
          color:      es.color || '#FF9800',
          lineWidth:  es.width || 1.5,
          lineStyle:  es.dashed ? 2 : 0,
          crosshairMarkerVisible: false,
          lastValueVisible:       true,
          priceLineVisible:       false,
          title:      es.name || '',
        });
        s.setData(normalized);
      });

      // ── Point markers (Head, Shoulders, XABCD labels, pattern points) ──
      const allMarkerItems = [];

      if (markers.length > 0 && normalizedData.length > 0) {
        markers.forEach(m => {
          const time = normalizeTime(m.time || m.date);
          if (!time) return;
          const match = normalizedData.find(p => p.time === time)
            || normalizedData.reduce((closest, p) =>
              Math.abs(new Date(p.time) - new Date(time)) <
              Math.abs(new Date(closest.time) - new Date(time)) ? p : closest
            );
          allMarkerItems.push({
            time:     match.time,
            position: m.position === 'below' ? 'belowBar' : 'aboveBar',
            color:    m.color || '#FF9800',
            shape:    m.shape || 'circle',
            text:     m.label || '',
            size:     m.size || 1,
          });
        });
      }

      // ── Vertical lines → arrow markers on the time axis ────────────────
      if (verticalLines.length > 0 && normalizedData.length > 0) {
        verticalLines.forEach(vl => {
          const time = normalizeTime(vl.time || vl.date);
          if (!time) return;
          const match = normalizedData.find(p => p.time === time)
            || normalizedData.reduce((closest, p) =>
              Math.abs(new Date(p.time) - new Date(time)) <
              Math.abs(new Date(closest.time) - new Date(time)) ? p : closest
            );
          allMarkerItems.push({
            time:     match.time,
            position: 'aboveBar',
            color:    vl.color || '#26A69A',
            shape:    'arrowDown',
            text:     vl.label || '',
            size:     1,
          });
        });
      }

      // v5 API: createSeriesMarkers instead of series.setMarkers()
      if (allMarkerItems.length > 0) {
        const sorted = allMarkerItems.sort((a, b) => a.time < b.time ? -1 : 1);
        createSeriesMarkers(mainSeries, sorted);
      }

      // Fit and handle resize
      chart.timeScale().fitContent();

      resizeObRef.current = new ResizeObserver(entries => {
        if (entries[0] && chartRef.current) {
          chartRef.current.applyOptions({ width: entries[0].contentRect.width });
        }
      });
      resizeObRef.current.observe(el);
    };

    init();

    return () => {
      cancelled = true;
      resizeObRef.current?.disconnect();
      cleanupRef.current.forEach(fn => { try { fn(); } catch {} });
      cleanupRef.current = [];
      chartRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, priceLines, slopeLines, markers, verticalLines, extraSeries]);

  // Live data update without recreating chart
  useEffect(() => {
    // Data updates handled by full remount when props change
  }, [data]);

  if (!data?.length) {
    return (
      <div style={{
        height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#1E222D', borderRadius: 4,
        color: '#4C525E', fontSize: 13,
      }}>
        No data to display
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#1E222D',
      border:          '1px solid #2A2E39',
      borderRadius:    6,
      overflow:        'hidden',
      marginBottom:    12,
    }}>
      {title && (
        <div style={{
          padding:      '10px 14px',
          borderBottom: '1px solid #2A2E39',
          display:      'flex',
          alignItems:   'center',
          gap:          8,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#787B86',
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            {title}
          </span>
          {symbol && (
            <span style={{
              fontSize: 11, color: '#2962FF', fontWeight: 600,
              backgroundColor: 'rgba(41,98,255,0.12)',
              padding: '2px 6px', borderRadius: 3,
            }}>
              {symbol}
            </span>
          )}
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height }} />
      <div style={{
        padding: '4px 8px 6px',
        fontSize: 10, color: '#4C525E', textAlign: 'right',
        pointerEvents: 'none',
      }}>
        Scroll to zoom · Drag to pan · Pinch on mobile
      </div>
    </div>
  );
};

export default TVPatternChart;