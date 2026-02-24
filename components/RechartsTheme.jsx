/**
 * RechartsTheme.jsx
 * Shared TradingView-style config for all pattern detector Recharts charts.
 * Import: import { TV, TVTooltip, TVChartContainer, TVChartLoading, TVChartEmpty, COLORS } from './RechartsTheme';
 */
import React from 'react';

export const COLORS = {
  bgCard:         '#1E222D',
  bgPanel:        '#131722',
  border:         '#2A2E39',
  borderLight:    '#363A45',
  textPrimary:    '#D1D4DC',
  textSecondary:  '#787B86',
  textMuted:      '#4C525E',
  accent:         '#2962FF',
  bull:           '#26A69A',
  bear:           '#EF5350',
  warn:           '#FF9800',
  axisStroke:     '#363A45',
  gridStroke:     '#2A2E39',
  tooltipBg:      '#1E222D',
  tooltipBorder:  '#363A45',
  line:           '#2962FF',
};

export const TV = {
  margin: { top: 8, right: 16, left: 8, bottom: 8 },

  grid: {
    strokeDasharray: '0',
    stroke:          COLORS.gridStroke,
    strokeOpacity:   1,
    vertical:        true,
    horizontal:      true,
  },

  xAxis: {
    stroke:   COLORS.axisStroke,
    tick:     { fill: COLORS.textSecondary, fontSize: 11 },
    axisLine: { stroke: COLORS.axisStroke },
    tickLine: { stroke: COLORS.axisStroke },
    height:   28,
  },

  yAxis: {
    stroke:   COLORS.axisStroke,
    tick:     { fill: COLORS.textSecondary, fontSize: 11 },
    axisLine: { stroke: COLORS.axisStroke },
    tickLine: { stroke: COLORS.axisStroke },
    width:    72,
    domain:   ['auto', 'auto'],
  },

  priceFormatter: (v) => {
    if (v == null || isNaN(v)) return '';
    if (Math.abs(v) >= 1000) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    return `$${parseFloat(v).toFixed(2)}`;
  },

  pctFormatter: (v) => {
    if (v == null || isNaN(v)) return '';
    return `${parseFloat(v).toFixed(2)}%`;
  },

  line: {
    type:      'monotone',
    stroke:    COLORS.accent,
    strokeWidth: 1.5,
    dot:       false,
    activeDot: { r: 3, fill: COLORS.accent, stroke: COLORS.bgCard, strokeWidth: 2 },
  },

  cursor: { stroke: COLORS.textMuted, strokeWidth: 1, strokeDasharray: '4 4' },
};

export const TVTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      backgroundColor: COLORS.tooltipBg,
      border:          `1px solid ${COLORS.tooltipBorder}`,
      borderRadius:    4,
      padding:         '8px 12px',
      fontSize:        12,
      color:           COLORS.textPrimary,
      boxShadow:       '0 4px 16px rgba(0,0,0,0.4)',
      pointerEvents:   'none',
    }}>
      {label && (
        <div style={{ color: COLORS.textSecondary, marginBottom: 4, fontSize: 11 }}>
          {label}
        </div>
      )}
      {payload.map((entry, i) => {
        const value = formatter
          ? formatter(entry.value, entry.name)
          : TV.priceFormatter(entry.value);
        return (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              backgroundColor: entry.color || entry.stroke || COLORS.accent,
              flexShrink: 0,
            }} />
            <span style={{ color: COLORS.textSecondary, fontSize: 11 }}>{entry.name}:</span>
            <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{value}</span>
          </div>
        );
      })}
    </div>
  );
};

export const TVChartContainer = ({ title, symbol, children, style }) => (
  <div style={{
    backgroundColor: COLORS.bgCard,
    border:          `1px solid ${COLORS.border}`,
    borderRadius:    6,
    marginBottom:    12,
    overflow:        'hidden',
    ...style,
  }}>
    {title && (
      <div style={{
        padding:      '10px 14px',
        borderBottom: `1px solid ${COLORS.border}`,
        display:      'flex',
        alignItems:   'center',
        gap:          8,
      }}>
        <span style={{
          fontSize:      11,
          fontWeight:    600,
          color:         COLORS.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}>
          {title}
        </span>
        {symbol && (
          <span style={{
            fontSize:        11,
            color:           COLORS.accent,
            fontWeight:      600,
            backgroundColor: 'rgba(41,98,255,0.12)',
            padding:         '2px 6px',
            borderRadius:    3,
          }}>
            {symbol}
          </span>
        )}
      </div>
    )}
    <div style={{ padding: '12px 8px 8px 4px', height: 320 }}>
      {children}
    </div>
  </div>
);

export const TVChartEmpty = ({ message = 'No data available' }) => (
  <div style={{
    backgroundColor: COLORS.bgCard,
    border:          `1px solid ${COLORS.border}`,
    borderRadius:    6,
    padding:         '32px 16px',
    textAlign:       'center',
    color:           COLORS.textMuted,
    fontSize:        13,
    marginBottom:    12,
  }}>
    {message}
  </div>
);

export const TVChartLoading = () => (
  <div style={{
    backgroundColor: COLORS.bgCard,
    border:          `1px solid ${COLORS.border}`,
    borderRadius:    6,
    padding:         '32px 16px',
    textAlign:       'center',
    color:           COLORS.accent,
    fontSize:        13,
    marginBottom:    12,
  }}>
    <div style={{
      width:          20, height:         20,
      border:         `2px solid ${COLORS.border}`,
      borderTopColor: COLORS.accent,
      borderRadius:   '50%',
      animation:      'tv-spin 0.7s linear infinite',
      margin:         '0 auto 8px',
    }} />
    Loading chart data…
  </div>
);

export const patternLabel = (text, color = COLORS.accent) => ({
  value:    text,
  position: 'insideTopRight',
  fill:     color,
  fontSize: 10,
  fontWeight: 600,
});

export default TV;