'use client';
import React, { useEffect, useRef, useCallback } from 'react';

/**
 * TVChart — lightweight-charts v5 (TradingView open-source)
 * API: chart.addSeries(LineSeries, options) — NOT addLineSeries()
 *
 * Props:
 *   data         — [{ date: string|number, value: number, yield?: number }]
 *   type         — 'line' | 'area'
 *   assetType    — 'stock' | 'crypto' | 'bond'
 *   yAxisMetric  — 'price' | 'yield'
 *   height       — number (default 380)
 */
const TVChart = ({
  data = [],
  type = 'line',
  assetType = 'stock',
  yAxisMetric = 'price',
  height = 380,
}) => {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);
  const resizeObRef  = useRef(null);

  const formatPrice = useCallback((value) => {
    if (assetType === 'bond' && yAxisMetric === 'yield') return `${value.toFixed(3)}%`;
    if (value >= 1000) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${value.toFixed(2)}`;
  }, [assetType, yAxisMetric]);

  const normalizeData = useCallback((raw) => {
    if (!raw || !Array.isArray(raw) || raw.length === 0) return [];
    return raw
      .map(point => {
        let time;
        if (typeof point.date === 'number') {
          time = Math.floor(point.date / 1000);
        } else if (typeof point.date === 'string') {
          const d = new Date(point.date);
          if (isNaN(d.getTime())) return null;
          // lightweight-charts needs 'YYYY-MM-DD'
          time = point.date.slice(0, 10);
        } else {
          return null;
        }
        const value = parseFloat(
          yAxisMetric === 'yield' && point.yield != null ? point.yield : point.value
        );
        if (isNaN(value)) return null;
        return { time, value };
      })
      .filter(Boolean)
      .sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0))
      .filter((item, idx, arr) => idx === 0 || item.time !== arr[idx - 1].time);
  }, [yAxisMetric]);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    const init = async () => {
      // v5 imports — LineSeries and AreaSeries are named exports
      const lc = await import('lightweight-charts');
      const { createChart, LineSeries, AreaSeries, CrosshairMode } = lc;

      if (cancelled || !containerRef.current) return;
      const el = containerRef.current;

      const chart = createChart(el, {
        width:  el.clientWidth,
        height,
        layout: {
          background:  { color: '#1E222D' },
          textColor:   '#787B86',
          fontFamily:  '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, sans-serif',
          fontSize:    12,
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
          scaleMargins: { top: 0.1, bottom: 0.1 },
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

      // v5 API: addSeries(SeriesClass, options)
      let series;
      if (type === 'area') {
        series = chart.addSeries(AreaSeries, {
          lineColor:    '#2962FF',
          topColor:     'rgba(41,98,255,0.28)',
          bottomColor:  'rgba(41,98,255,0.02)',
          lineWidth:    2,
          crosshairMarkerVisible:         true,
          crosshairMarkerRadius:          4,
          crosshairMarkerBorderColor:     '#2962FF',
          crosshairMarkerBackgroundColor: '#1E222D',
          priceFormat: { type: 'custom', formatter: formatPrice },
        });
      } else {
        series = chart.addSeries(LineSeries, {
          color:      '#2962FF',
          lineWidth:  2,
          crosshairMarkerVisible:         true,
          crosshairMarkerRadius:          4,
          crosshairMarkerBorderColor:     '#2962FF',
          crosshairMarkerBackgroundColor: '#1E222D',
          priceFormat: { type: 'custom', formatter: formatPrice },
        });
      }

      seriesRef.current = series;

      const normalized = normalizeData(data);
      if (normalized.length > 0) {
        series.setData(normalized);
        chart.timeScale().fitContent();
      }

      // Responsive
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
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, height]);

  // Update data without recreating chart
  useEffect(() => {
    if (!seriesRef.current) return;
    const normalized = normalizeData(data);
    if (normalized.length > 0) {
      seriesRef.current.setData(normalized);
      chartRef.current?.timeScale().fitContent();
    }
  }, [data, normalizeData]);

  if (!data || data.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#1E222D', borderRadius: 4,
        color: '#4C525E', fontSize: 13,
      }}>
        No price data to display
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', borderRadius: 4, overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height }} />
      <div style={{
        position: 'absolute', bottom: 8, right: 8,
        fontSize: 10, color: '#4C525E',
        pointerEvents: 'none', userSelect: 'none',
      }}>
        Scroll to zoom · Drag to pan · Pinch on mobile
      </div>
    </div>
  );
};

export default TVChart;