import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, TrendingDown, AlertCircle, ChevronDown, ChevronUp,
  ArrowLeft, LineChart, BarChart2, Activity, Triangle, BookOpen, RefreshCw, Search
} from 'lucide-react';
import { TrendingUp as TrendingUpIcon } from 'lucide-react';
import InvestmentProtocol from './InvestmentProtocol';
import InvestmentAnalysis from './InvestmentAnalysis';
import HeadAndShouldersDetector from './HeadAndShouldersDetector';
import AdvancedPatternDetector from './AdvancedPatternDetector';
import EnhancedHarmonicPatternDetector from './EnhancedHarmonicPatternDetector';
import EnhancedClassicPatternDetector from './EnhancedClassicPatternDetector';
import ChartPatternVisualizer from './ChartPatternVisualizer';
import AccountMenu from './AccountMenu';
import SubscriptionGate from './SubscriptionGate';

/* ─── Design tokens (inline — no Tailwind custom classes needed) ─── */
const C = {
  bgPrimary:   '#131722',
  bgSecondary: '#1E222D',
  bgTertiary:  '#2A2E39',
  bgElevated:  '#363A45',
  border:      '#2A2E39',
  borderLight: '#363A45',
  accent:      '#2962FF',
  accentHover: '#1E53E5',
  accentDim:   'rgba(41,98,255,0.15)',
  textPrimary: '#D1D4DC',
  textSecondary:'#787B86',
  textMuted:   '#4C525E',
  white:       '#FFFFFF',
  bull:        '#26A69A',
  bullDim:     'rgba(38,166,154,0.15)',
  bear:        '#EF5350',
  bearDim:     'rgba(239,83,80,0.15)',
  warn:        '#FF9800',
};

/* ─── Shared inline style helpers ─── */
const styles = {
  card: {
    backgroundColor: C.bgSecondary,
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '10px 16px',
    borderBottom: `1px solid ${C.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    margin: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: 500,
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    display: 'block',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    backgroundColor: C.bgTertiary,
    border: `1px solid ${C.border}`,
    borderRadius: 4,
    padding: '8px 12px',
    color: C.textPrimary,
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.15s ease',
    WebkitAppearance: 'none',
    appearance: 'none',
  },
  select: {
    width: '100%',
    backgroundColor: C.bgTertiary,
    border: `1px solid ${C.border}`,
    borderRadius: 4,
    padding: '8px 12px',
    color: C.textPrimary,
    fontSize: 13,
    outline: 'none',
    cursor: 'pointer',
    WebkitAppearance: 'none',
    appearance: 'none',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '7px 14px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    whiteSpace: 'nowrap',
    WebkitTapHighlightColor: 'transparent',
  },
  btnGhost: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    color: C.textSecondary,
    border: `1px solid ${C.border}`,
    borderRadius: 4,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, color 0.15s ease',
    whiteSpace: 'nowrap',
    WebkitTapHighlightColor: 'transparent',
  },
  dataRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '9px 16px',
    borderBottom: `1px solid ${C.border}`,
    fontSize: 13,
  },
};

/* ─── Sub components ─── */
function SubView({ title, onBack, children }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bgPrimary }}>
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '16px 16px' }}>
        <button
          onClick={onBack}
          style={{ ...styles.btnGhost, marginBottom: 16 }}
        >
          <ArrowLeft size={14} />
          Back to Asset Analyzer
        </button>
        <div style={{ color: C.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div style={styles.dataRow}>
      <span style={{ color: C.textSecondary }}>{label}</span>
      <span style={{ color: C.textPrimary, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function SectionCard({ title, isOpen, onToggle, accentColor, children }) {
  return (
    <div style={styles.card}>
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onToggle()}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: isOpen ? `1px solid ${C.border}` : 'none',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: accentColor || C.white }}>
          {title}
        </span>
        {isOpen
          ? <ChevronUp size={15} color={C.textSecondary} />
          : <ChevronDown size={15} color={C.textSecondary} />
        }
      </div>
      {isOpen && (
        <div style={{ padding: 16 }} className="tv-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Main Display ─── */
const Display = ({
  assetData,
  assetType,
  selectedBondCategory,
  timeRange,
  chartType,
  yAxisMetric,
  loading,
  error,
  priceChangeColor,
  handleAssetTypeChange,
  handleUpdateChart,
  setTimeRange,
  setChartType,
  setYAxisMetric,
  renderSearchInput,
  renderChart,
  renderTechnicalAnalysis,
  searchProps,
  historicalData,
  marketData,
  financialData,
}) => {
  const [showProtocol, setShowProtocol] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showPatternAnalysis, setShowPatternAnalysis] = useState(false);
  const [currentPattern, setCurrentPattern] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    headAndShoulders: false,
    advancedPatterns: false,
    harmonicPatterns: false,
    classicPatterns: false,
  });

  const toggle = (k) => setExpandedSections(p => ({ ...p, [k]: !p[k] }));

  const handlePatternView = (type) => {
    setCurrentPattern(type);
    setShowPatternAnalysis(true);
  };

  const isPositive = assetData.change ? parseFloat(assetData.change) >= 0 : null;
  const hasData = !!(assetData.price || assetData.overview);

  /* ── Sub-views ── */
  if (showProtocol) {
    return (
      <SubView title="Investment Protocol" onBack={() => setShowProtocol(false)}>
        <InvestmentProtocol />
      </SubView>
    );
  }

  if (showAnalysis) {
    return (
      <SubView title="Investment Analysis" onBack={() => setShowAnalysis(false)}>
        {assetData.symbol && (
          <InvestmentAnalysis
            symbol={assetData.symbol}
            marketData={marketData}
            historicalData={historicalData?.prices}
            financialData={financialData}
          />
        )}
      </SubView>
    );
  }

  const patternMap = {
    classic:       { label: 'Classic Chart Patterns',    Component: EnhancedClassicPatternDetector, color: C.textPrimary },
    headShoulders: { label: 'Head & Shoulders Pattern',  Component: HeadAndShouldersDetector,       color: C.textPrimary },
    advanced:      { label: 'Advanced Pattern Analysis', Component: AdvancedPatternDetector,         color: C.textPrimary },
    harmonic:      { label: 'Harmonic Pattern Analysis', Component: EnhancedHarmonicPatternDetector, color: C.textPrimary },
    chartjs:       { label: 'Chart.js Pattern Analysis', Component: ChartPatternVisualizer,          color: C.textPrimary },
  };

  if (showPatternAnalysis) {
    const entry = patternMap[currentPattern];
    return (
      <SubView title={entry?.label || 'Pattern Analysis'} onBack={() => setShowPatternAnalysis(false)}>
        {entry ? (
          <div style={styles.card}>
            <div style={{ padding: 16 }}>
              <entry.Component symbol={assetData.symbol} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(patternMap).map(([k, { label, Component, color }]) => (
              <SectionCard key={k} title={label} isOpen={!!expandedSections[k]} onToggle={() => toggle(k)} accentColor={color}>
                <Component symbol={assetData.symbol} />
              </SectionCard>
            ))}
          </div>
        )}
      </SubView>
    );
  }

  /* ── Main view ── */
  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bgPrimary }}>
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ── HEADER CARD ── */}
        <div style={styles.card}>

          {/* Top row: title + action buttons */}
          <div style={{ ...styles.cardHeader, padding: '12px 16px' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.white, lineHeight: 1.2 }}>
                Compound<span style={{ color: C.accent }}>Pulse</span>
              </div>
              <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>
                Stocks · Crypto · Bonds
              </div>
            </div>

            {/* Desktop action buttons + AccountMenu */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => setShowAnalysis(true)}
                disabled={!assetData.symbol}
                style={{
                  ...styles.btnGhost,
                  opacity: assetData.symbol ? 1 : 0.4,
                  cursor: assetData.symbol ? 'pointer' : 'not-allowed',
                }}
              >
                <LineChart size={13} />
                <span style={{ display: 'none' }} className="sm-show">Analysis</span>
              </button>
              <button
                onClick={() => setShowProtocol(true)}
                style={styles.btnGhost}
              >
                <BookOpen size={13} />
                <span style={{ display: 'none' }} className="sm-show">Protocol</span>
              </button>
              <AccountMenu />
            </div>
          </div>

          {/* Controls: Asset Type | Symbol | Time Range */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            borderBottom: `1px solid ${C.border}`,
          }}>
            {/* Asset Type */}
            <div style={{ padding: '12px 16px', borderRight: `1px solid ${C.border}` }}>
              <span style={styles.label}>Asset Type</span>
              <select
                value={assetType}
                onChange={handleAssetTypeChange}
                style={styles.select}
              >
                <option value="stock">Stock</option>
                <option value="crypto">Cryptocurrency</option>
                <option value="bond">Bond</option>
              </select>
            </div>

            {/* Symbol */}
            <div style={{ padding: '12px 16px', borderRight: `1px solid ${C.border}` }}>
              <span style={styles.label}>Symbol</span>
              {renderSearchInput({ ...searchProps })}
            </div>

            {/* Time Range + Update */}
            <div style={{ padding: '12px 16px' }}>
              <span style={styles.label}>Time Range</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  style={{ ...styles.select, flex: 1 }}
                >
                  <option value="7">7 Days</option>
                  <option value="30">30 Days</option>
                  <option value="90">90 Days</option>
                  <option value="180">180 Days</option>
                  <option value="365">1 Year</option>
                  <option value="1825">5 Years</option>
                  <option value="3650">10 Years</option>
                </select>
                <button
                  onClick={handleUpdateChart}
                  style={{ ...styles.btnPrimary, padding: '8px 12px', flexShrink: 0 }}
                  title="Refresh"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Error / Loading strips */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 16px',
              backgroundColor: C.bearDim,
              borderTop: `1px solid rgba(239,83,80,0.25)`,
              color: C.bear,
              fontSize: 13,
            }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}
          {loading && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 16px',
              backgroundColor: C.accentDim,
              borderTop: `1px solid rgba(41,98,255,0.25)`,
              color: C.accent,
              fontSize: 13,
            }}>
              <div className="tv-spinner" />
              Loading asset data…
            </div>
          )}
        </div>

        {/* ── PATTERN TOOLBAR ── */}
        <div style={{ ...styles.card, backgroundColor: C.bgPrimary }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 14px', alignItems: 'center' }}>
            <span style={{ ...styles.label, marginBottom: 0, marginRight: 4 }}>Patterns:</span>
            {[
              { key: 'classic',       Icon: BarChart2,      label: 'Classic' },
              { key: 'headShoulders', Icon: Activity,       label: 'H&S' },
              { key: 'advanced',      Icon: TrendingUpIcon, label: 'Advanced' },
              { key: 'harmonic',      Icon: Triangle,       label: 'Harmonic' },
              { key: 'chartjs',       Icon: LineChart,      label: 'Chart.js' },
            ].map(({ key, Icon, label }) => (
              <button
                key={key}
                onClick={() => handlePatternView(key)}
                style={styles.btnGhost}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── SYMBOL PRICE HEADER ── */}
        {assetData.price && (
          <div style={styles.card} className="tv-fade-in">
            <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 24px' }}>

              {/* Symbol icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  backgroundColor: C.accentDim,
                  border: `1px solid ${C.accent}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: C.accent,
                  flexShrink: 0,
                }}>
                  {assetData.symbol?.charAt(0) || 'A'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.white }}>{assetData.symbol}</div>
                  {assetData.overview?.name && (
                    <div style={{ fontSize: 11, color: C.textSecondary }}>{assetData.overview.name}</div>
                  )}
                </div>
              </div>

              {/* Price */}
              <div>
                <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 2 }}>Price</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.white }}>
                  ${parseFloat(assetData.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Change badge */}
              {assetData.change && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px',
                  backgroundColor: isPositive ? C.bullDim : C.bearDim,
                  color: isPositive ? C.bull : C.bear,
                  borderRadius: 3,
                  fontSize: 13, fontWeight: 600,
                }}>
                  {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {isPositive ? '+' : ''}{assetData.changePercent}%
                </div>
              )}

              {/* Mobile: full-width action buttons */}
              <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 4 }}>
                <button
                  onClick={() => setShowAnalysis(true)}
                  disabled={!assetData.symbol}
                  style={{
                    ...styles.btnPrimary,
                    flex: 1,
                    fontSize: 12,
                    padding: '8px 12px',
                    opacity: assetData.symbol ? 1 : 0.4,
                  }}
                >
                  <LineChart size={13} />
                  Investment Analysis
                </button>
                <button
                  onClick={() => setShowProtocol(true)}
                  style={{ ...styles.btnGhost, flex: 1, fontSize: 12, padding: '8px 12px' }}
                >
                  <BookOpen size={13} />
                  Protocol
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MAIN DATA GRID ── */}
        {hasData && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>

            {/* On xl screens: sidebar + main */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Flex row on large screens */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Market Data Panel */}
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.cardTitle}>Market Data</span>
                  </div>
                  <div>
                    {assetType === 'stock' && (
                      <>
                        <DataRow label="Symbol"     value={assetData.symbol} />
                        <DataRow label="Name"       value={assetData.name || assetData.symbol} />
                        <DataRow label="Price"      value={`$${parseFloat(assetData.price).toFixed(2)}`} />
                        <DataRow label="Volume"     value={marketData.volume ? marketData.volume.toLocaleString() : 'N/A'} />
                        <DataRow label="Avg Volume" value={marketData.avgVolume ? marketData.avgVolume.toLocaleString() : 'N/A'} />
                      </>
                    )}
                    {assetType === 'crypto' && assetData.overview &&
                      Object.entries(assetData.overview)
                        .filter(([, v]) => v !== null && v !== undefined)
                        .map(([key, value]) => {
                          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                          let formatted = value;
                          if (typeof value === 'number') {
                            formatted = /price|value|cap|volume/i.test(key)
                              ? '$' + value.toLocaleString()
                              : value.toLocaleString();
                          }
                          return <DataRow key={key} label={label} value={formatted} />;
                        })
                    }
                    {assetType === 'bond' && assetData.overview &&
                      Object.entries(assetData.overview)
                        .filter(([, v]) => v !== null && v !== undefined)
                        .map(([key, value]) => (
                          <DataRow key={key} label={key.replace(/([A-Z])/g, ' $1').trim()} value={value} />
                        ))
                    }
                  </div>
                </div>

                {/* Price Chart Card */}
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.cardTitle}>Price Chart</span>
                    {/* Chart controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {assetType === 'bond' && (
                        <select
                          value={yAxisMetric}
                          onChange={(e) => setYAxisMetric(e.target.value)}
                          style={{ ...styles.select, width: 'auto', fontSize: 11, padding: '4px 24px 4px 8px' }}
                        >
                          <option value="price">Price</option>
                          <option value="yield">Yield</option>
                        </select>
                      )}
                      {/* Chart type toggle */}
                      <div style={{
                        display: 'flex',
                        backgroundColor: C.bgPrimary,
                        border: `1px solid ${C.border}`,
                        borderRadius: 4,
                        padding: 3,
                        gap: 2,
                      }}>
                        {['line', 'area'].map(type => (
                          <button
                            key={type}
                            onClick={() => setChartType(type)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 3,
                              fontSize: 11,
                              fontWeight: 500,
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              backgroundColor: chartType === type ? C.bgElevated : 'transparent',
                              color: chartType === type ? C.white : C.textSecondary,
                            }}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: 16 }}>
                    {renderChart()}
                  </div>
                </div>

                {/* Technical Analysis Card */}
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.cardTitle}>Technical Analysis</span>
                  </div>
                  <div style={{ padding: 16 }}>
                    {renderTechnicalAnalysis()}
                  </div>
                </div>

                {/* Collapsible Pattern Sections */}
                {assetData.symbol && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <SectionCard
                      title="Classic Chart Patterns"
                      isOpen={expandedSections.classicPatterns}
                      onToggle={() => toggle('classicPatterns')}
                      accentColor={C.textPrimary}
                    >
                      <SubscriptionGate featureName="Classic Chart Patterns">
                        <EnhancedClassicPatternDetector symbol={assetData.symbol} />
                      </SubscriptionGate>
                    </SectionCard>

                    <SectionCard
                      title="Head & Shoulders Pattern"
                      isOpen={expandedSections.headAndShoulders}
                      onToggle={() => toggle('headAndShoulders')}
                      accentColor={C.textPrimary}
                    >
                      <SubscriptionGate featureName="Head & Shoulders Pattern">
                        <HeadAndShouldersDetector symbol={assetData.symbol} />
                      </SubscriptionGate>
                    </SectionCard>

                    <SectionCard
                      title="Advanced Pattern Analysis"
                      isOpen={expandedSections.advancedPatterns}
                      onToggle={() => toggle('advancedPatterns')}
                      accentColor={C.textPrimary}
                    >
                      <SubscriptionGate featureName="Advanced Pattern Analysis">
                        <AdvancedPatternDetector symbol={assetData.symbol} />
                      </SubscriptionGate>
                    </SectionCard>

                    <SectionCard
                      title="Harmonic Pattern Analysis"
                      isOpen={expandedSections.harmonicPatterns}
                      onToggle={() => toggle('harmonicPatterns')}
                      accentColor={C.textPrimary}
                    >
                      <SubscriptionGate featureName="Harmonic Pattern Analysis">
                        <EnhancedHarmonicPatternDetector symbol={assetData.symbol} />
                      </SubscriptionGate>
                    </SectionCard>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!hasData && !loading && (
          <div style={{ ...styles.card, padding: '60px 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
              <Search size={36} color={C.textMuted} />
              <div style={{ fontWeight: 600, fontSize: 15, color: C.textPrimary }}>
                Search for an asset to get started
              </div>
              <div style={{ fontSize: 13, color: C.textSecondary }}>
                Enter a stock symbol, crypto ticker, or select a bond above
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Display;