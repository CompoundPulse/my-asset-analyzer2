import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cryptoMap } from './cryptoMap';
import { stockSymbols } from './stockUtils';
import { bondCategories } from './bondUtils';

export const BondSearch = ({ 
  selectedBondCategory, 
  setSelectedBondCategory, 
  assetData, 
  setAssetData, 
  handleBondFetch 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="relative">
      <div className="w-full space-y-2">
        <select
          value={selectedBondCategory}
          onChange={(e) => setSelectedBondCategory(e.target.value)}
          className="w-full p-3 rounded-xl bg-[#1a1f2d] border-blue-500/30 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
        >
          <option value="">All Bond Categories</option>
          {Object.entries(bondCategories).map(([category, data]) => (
            <option key={category} value={category}>
              {data.name}
            </option>
          ))}
        </select>

        <Input
          type="text"
          placeholder="Search bonds"
          value={assetData.symbol}
          onChange={(e) => {
            const value = e.target.value.toUpperCase();
            setAssetData(prev => ({ ...prev, symbol: value }));
            setIsDropdownOpen(value.length > 0);
          }}
          className="w-full rounded-xl bg-[#1a1f2d] border-blue-500/30 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
        />
      </div>

      {isDropdownOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-lg"
            style={{ zIndex: 9998 }}
            onClick={() => setIsDropdownOpen(false)}
          />
          <div 
            className="fixed left-1/2 top-1/4 -translate-x-1/2 w-[500px] bg-[#1a1f2d] border border-blue-500/30 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-auto"
            style={{ 
              zIndex: 9999,
              maxHeight: '60vh'
            }}
          >
            {Object.entries(bondCategories)
              .filter(([category]) => !selectedBondCategory || category === selectedBondCategory)
              .map(([category, data]) => (
                <div key={category}>
                  <div className="px-4 py-3 bg-[#232936] font-semibold text-white">
                    {data.name}
                    <span className="text-sm text-white/60 ml-2">
                      {data.description}
                    </span>
                  </div>
                  {Object.entries(data.symbols)
                    .filter(([symbol, name]) => 
                      !assetData.symbol ||
                      symbol.includes(assetData.symbol) || 
                      name.toLowerCase().includes(assetData.symbol.toLowerCase())
                    )
                    .map(([symbol, name]) => (
                      <div
                        key={symbol}
                        className="px-4 py-3 hover:bg-blue-500/30 transition-all duration-200 cursor-pointer text-white group"
                        onClick={() => {
                          setAssetData(prev => ({ ...prev, symbol }));
                          setIsDropdownOpen(false);
                          handleBondFetch(symbol);
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-white group-hover:text-white/90">{symbol}</span>
                          <span className="text-white/60 text-sm group-hover:text-white/80">{name}</span>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
};

export const StockSearch = ({ 
    assetData, 
    setAssetData, 
    handleStockFetch, 
    timeRange, 
    setLoading, 
    setError, 
    setHistoricalData 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="relative">
      <div className="w-full">
        <Input
          type="text"
          placeholder="Search stocks (e.g., AAPL)"
          value={assetData.symbol}
          onChange={(e) => {
            const value = e.target.value.toUpperCase();
            setAssetData(prev => ({ ...prev, symbol: value }));
            setIsDropdownOpen(value.length > 0);
          }}
          className="w-full rounded-xl bg-[#1a1f2d] border-blue-500/30 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
        />
      </div>

      {isDropdownOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-lg"
            style={{ zIndex: 9998 }}
            onClick={() => setIsDropdownOpen(false)}
          />
          <div 
            className="fixed left-1/2 top-1/4 -translate-x-1/2 w-[500px] bg-[#1a1f2d] border border-blue-500/30 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-auto"
            style={{ 
              zIndex: 9999,
              maxHeight: '60vh'
            }}
          >
            {stockSymbols
              .filter(symbol => symbol.includes(assetData.symbol))
              .map(symbol => (
                <div
                  key={symbol}
                  className="px-4 py-3 hover:bg-blue-500/30 transition-all duration-200 cursor-pointer text-white group"
                  onClick={() => {
                    setAssetData(prev => ({ ...prev, symbol }));
                    setIsDropdownOpen(false);
                    handleStockFetch(symbol, timeRange, {
                      setLoading,
                      setError,
                      setAssetData,
                      setHistoricalData
                    });
                  }}
                >
                  <span className="font-medium text-white group-hover:text-white/90">{symbol}</span>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
};

export const CryptoSearch = ({ assetData, setAssetData, fetchCryptoData }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="relative">
      <div className="w-full">
        <Input
          type="text"
          placeholder="Search crypto (e.g., BTC)"
          value={assetData.symbol}
          onChange={(e) => {
            const value = e.target.value.toUpperCase();
            setAssetData(prev => ({ ...prev, symbol: value }));
            setIsDropdownOpen(value.length > 0);
          }}
          className="w-full rounded-xl bg-[#1a1f2d] border-blue-500/30 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
        />
      </div>

      {isDropdownOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-lg"
            style={{ zIndex: 9998 }}
            onClick={() => setIsDropdownOpen(false)}
          />
          <div 
            className="fixed left-1/2 top-1/4 -translate-x-1/2 w-[500px] bg-[#1a1f2d] border border-blue-500/30 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-auto"
            style={{ 
              zIndex: 9999,
              maxHeight: '60vh'
            }}
          >
            {Object.entries(cryptoMap)
              .filter(([symbol, name]) => 
                symbol.includes(assetData.symbol) || 
                name.toLowerCase().includes(assetData.symbol.toLowerCase())
              )
              .map(([symbol, name]) => (
                <div
                  key={symbol}
                  className="px-4 py-3 hover:bg-blue-500/30 transition-all duration-200 cursor-pointer text-white group"
                  onClick={() => {
                    setAssetData(prev => ({ ...prev, symbol }));
                    setIsDropdownOpen(false);
                    fetchCryptoData(symbol);
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-white group-hover:text-white/90">{symbol}</span>
                    <span className="text-white/60 group-hover:text-white/80">
                      {name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
};

export const renderSearchInput = ({ 
    assetType, 
    selectedBondCategory, 
    setSelectedBondCategory, 
    assetData, 
    setAssetData, 
    handleBondFetch, 
    handleStockFetch, 
    fetchCryptoData,
    timeRange,
    setLoading,
    setError,
    setHistoricalData
}) => {
  switch(assetType) {
    case 'bond':
      return (
        <BondSearch
          selectedBondCategory={selectedBondCategory}
          setSelectedBondCategory={setSelectedBondCategory}
          assetData={assetData}
          setAssetData={setAssetData}
          handleBondFetch={handleBondFetch}
        />
      );
    case 'stock':
      return (
        <StockSearch
          assetData={assetData}
          setAssetData={setAssetData}
          handleStockFetch={handleStockFetch}
          timeRange={timeRange}
          setLoading={setLoading}
          setError={setError}
          setHistoricalData={setHistoricalData}
        />
      );
    case 'crypto':
      return (
        <CryptoSearch
          assetData={assetData}
          setAssetData={setAssetData}
          fetchCryptoData={fetchCryptoData}
        />
      );
    default:
      return null;
  }
};