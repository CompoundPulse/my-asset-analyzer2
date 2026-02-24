import React, { useState, useEffect, useRef } from 'react';
import { cryptoMap } from './cryptoMap';
import { stockSymbols } from './stockUtils';
import { bondCategories } from './bondUtils';

const C = {
  bgTertiary:  '#2A2E39',
  bgElevated:  '#363A45',
  bgSecondary: '#1E222D',
  border:      '#2A2E39',
  borderLight: '#363A45',
  accent:      '#2962FF',
  textPrimary: '#D1D4DC',
  textSecondary:'#787B86',
  white:       '#FFFFFF',
};

const inputStyle = {
  width: '100%',
  backgroundColor: C.bgTertiary,
  border: `1px solid ${C.border}`,
  borderRadius: 4,
  padding: '8px 12px',
  color: C.textPrimary,
  fontSize: 13,
  outline: 'none',
  transition: 'border-color 0.15s ease',
};

/* ── Dropdown Overlay ── */
function Dropdown({ children, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9998,
        }}
      />
      <div
        ref={ref}
        style={{
          position: 'fixed',
          left: '50%',
          top: '25%',
          transform: 'translateX(-50%)',
          width: 'min(480px, 92vw)',
          maxHeight: '55vh',
          overflowY: 'auto',
          backgroundColor: C.bgElevated,
          border: `1px solid ${C.borderLight}`,
          borderRadius: 6,
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          zIndex: 9999,
        }}
      >
        {children}
      </div>
    </>
  );
}

function DropdownItem({ primary, secondary, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        cursor: 'pointer',
        borderBottom: `1px solid ${C.border}`,
        backgroundColor: hovered ? C.bgTertiary : 'transparent',
        transition: 'background-color 0.1s ease',
      }}
    >
      <span style={{ color: C.white, fontWeight: 500, fontSize: 13 }}>{primary}</span>
      {secondary && <span style={{ color: C.textSecondary, fontSize: 12 }}>{secondary}</span>}
    </div>
  );
}

function GroupHeader({ title, subtitle }) {
  return (
    <div
      style={{
        position: 'sticky', top: 0,
        padding: '8px 16px',
        backgroundColor: C.bgSecondary,
        borderBottom: `1px solid ${C.border}`,
        fontSize: 11, fontWeight: 600,
        color: C.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      {title}
      {subtitle && <span style={{ fontWeight: 400, marginLeft: 6, fontSize: 11 }}>{subtitle}</span>}
    </div>
  );
}

/* ════════════════════ Bond Search ════════════════════ */
export const BondSearch = ({ selectedBondCategory, setSelectedBondCategory, assetData, setAssetData, handleBondFetch }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <select
        value={selectedBondCategory}
        onChange={(e) => setSelectedBondCategory(e.target.value)}
        style={{
          ...inputStyle,
          WebkitAppearance: 'none',
          appearance: 'none',
          cursor: 'pointer',
        }}
      >
        <option value="">All Categories</option>
        {Object.entries(bondCategories).map(([cat, data]) => (
          <option key={cat} value={cat}>{data.name}</option>
        ))}
      </select>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Search bonds…"
          value={assetData.symbol}
          style={inputStyle}
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            setAssetData(prev => ({ ...prev, symbol: v }));
            setIsOpen(v.length > 0);
          }}
          onFocus={(e) => (e.target.style.borderColor = C.accent)}
          onBlur={(e) => (e.target.style.borderColor = C.border)}
        />
        {isOpen && (
          <Dropdown onClose={() => setIsOpen(false)}>
            {Object.entries(bondCategories)
              .filter(([cat]) => !selectedBondCategory || cat === selectedBondCategory)
              .map(([cat, data]) => (
                <div key={cat}>
                  <GroupHeader title={data.name} subtitle={data.description} />
                  {Object.entries(data.symbols)
                    .filter(([sym, name]) =>
                      !assetData.symbol ||
                      sym.includes(assetData.symbol) ||
                      name.toLowerCase().includes(assetData.symbol.toLowerCase())
                    )
                    .map(([sym, name]) => (
                      <DropdownItem
                        key={sym}
                        primary={sym}
                        secondary={name}
                        onClick={() => {
                          setAssetData(prev => ({ ...prev, symbol: sym }));
                          setIsOpen(false);
                          handleBondFetch(sym);
                        }}
                      />
                    ))}
                </div>
              ))}
          </Dropdown>
        )}
      </div>
    </div>
  );
};

/* ════════════════════ Stock Search ════════════════════ */
export const StockSearch = ({ assetData, setAssetData, handleStockFetch, timeRange, setLoading, setError, setHistoricalData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const filtered = stockSymbols.filter(s => s.includes(assetData.symbol || '')).slice(0, 40);

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder="Search stocks (e.g. AAPL)"
        value={assetData.symbol}
        style={inputStyle}
        onChange={(e) => {
          const v = e.target.value.toUpperCase();
          setAssetData(prev => ({ ...prev, symbol: v }));
          setIsOpen(v.length > 0);
        }}
        onFocus={(e) => (e.target.style.borderColor = C.accent)}
        onBlur={(e) => (e.target.style.borderColor = C.border)}
      />
      {isOpen && filtered.length > 0 && (
        <Dropdown onClose={() => setIsOpen(false)}>
          <GroupHeader title="Stocks" />
          {filtered.map(sym => (
            <DropdownItem
              key={sym}
              primary={sym}
              onClick={() => {
                setAssetData(prev => ({ ...prev, symbol: sym }));
                setIsOpen(false);
                handleStockFetch(sym, timeRange, { setLoading, setError, setAssetData, setHistoricalData });
              }}
            />
          ))}
        </Dropdown>
      )}
    </div>
  );
};

/* ════════════════════ Crypto Search ════════════════════ */
export const CryptoSearch = ({ assetData, setAssetData, fetchCryptoData }) => {
  const [isOpen, setIsOpen] = useState(false);

  const filtered = Object.entries(cryptoMap)
    .filter(([sym, name]) =>
      sym.includes(assetData.symbol || '') ||
      name.toLowerCase().includes((assetData.symbol || '').toLowerCase())
    )
    .slice(0, 40);

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder="Search crypto (e.g. BTC)"
        value={assetData.symbol}
        style={inputStyle}
        onChange={(e) => {
          const v = e.target.value.toUpperCase();
          setAssetData(prev => ({ ...prev, symbol: v }));
          setIsOpen(v.length > 0);
        }}
        onFocus={(e) => (e.target.style.borderColor = C.accent)}
        onBlur={(e) => (e.target.style.borderColor = C.border)}
      />
      {isOpen && filtered.length > 0 && (
        <Dropdown onClose={() => setIsOpen(false)}>
          <GroupHeader title="Cryptocurrencies" />
          {filtered.map(([sym, name]) => (
            <DropdownItem
              key={sym}
              primary={sym}
              secondary={name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              onClick={() => {
                setAssetData(prev => ({ ...prev, symbol: sym }));
                setIsOpen(false);
                fetchCryptoData(sym);
              }}
            />
          ))}
        </Dropdown>
      )}
    </div>
  );
};

/* ════════════════════ renderSearchInput ════════════════════ */
export const renderSearchInput = ({
  assetType, selectedBondCategory, setSelectedBondCategory,
  assetData, setAssetData, handleBondFetch, handleStockFetch,
  fetchCryptoData, timeRange, setLoading, setError, setHistoricalData,
}) => {
  switch (assetType) {
    case 'bond':
      return <BondSearch {...{ selectedBondCategory, setSelectedBondCategory, assetData, setAssetData, handleBondFetch }} />;
    case 'stock':
      return <StockSearch {...{ assetData, setAssetData, handleStockFetch, timeRange, setLoading, setError, setHistoricalData }} />;
    case 'crypto':
      return <CryptoSearch {...{ assetData, setAssetData, fetchCryptoData }} />;
    default:
      return null;
  }
};