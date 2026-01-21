import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, AlertCircle, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { BookOpen, ArrowLeft, LineChart, TrendingUp as TrendingUpIcon, BarChart2, Activity, Triangle } from 'lucide-react';
import InvestmentProtocol from './InvestmentProtocol';
import InvestmentAnalysis from './InvestmentAnalysis';
import HeadAndShouldersDetector from './HeadAndShouldersDetector';
import AdvancedPatternDetector from './AdvancedPatternDetector';
import EnhancedHarmonicPatternDetector from './EnhancedHarmonicPatternDetector';
import EnhancedClassicPatternDetector from './EnhancedClassicPatternDetector';
import ChartPatternVisualizer from './ChartPatternVisualizer';

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
  financialData
}) => {
  const [showProtocol, setShowProtocol] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showPatternAnalysis, setShowPatternAnalysis] = useState(false);
  const [currentPattern, setCurrentPattern] = useState('');
  
  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    headAndShoulders: false,
    advancedPatterns: false,
    harmonicPatterns: false,
    classicPatterns: false
  });

  // Function to toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle direct pattern analysis view
  const handlePatternView = (patternType) => {
    setCurrentPattern(patternType);
    setShowPatternAnalysis(true);
  };

  // Handle Investment Protocol View
  if (showProtocol) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950">
        <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="relative p-6 max-w-6xl mx-auto space-y-8">
          <Button
            onClick={() => setShowProtocol(false)}
            className="mb-4 bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Asset Analyzer
          </Button>
          <InvestmentProtocol />
        </div>
      </div>
    );
  }

  // Handle Investment Analysis View
  if (showAnalysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950">
        <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="relative p-6 max-w-6xl mx-auto space-y-8">
          <Button
            onClick={() => setShowAnalysis(false)}
            className="mb-4 bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Asset Analyzer
          </Button>
          {assetData.symbol && (
            <InvestmentAnalysis
              symbol={assetData.symbol}
              marketData={marketData}
              historicalData={historicalData?.prices}
              financialData={financialData}
            />
          )}
        </div>
      </div>
    );
  }

  // Handle Pattern Analysis View
  if (showPatternAnalysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950">
        <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="relative p-6 max-w-6xl mx-auto space-y-8">
          <Button
            onClick={() => setShowPatternAnalysis(false)}
            className="mb-4 bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Asset Analyzer
          </Button>
          
          {/* Display the selected pattern component */}
          {currentPattern === 'classic' && (
            <div className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-xl font-bold bg-gradient-to-r from-amber-200 to-orange-300 bg-clip-text text-transparent">Classic Chart Pattern Analysis</h3>
              </div>
              <div className="p-4">
                <EnhancedClassicPatternDetector symbol={assetData.symbol} />
              </div>
            </div>
          )}
          
          {currentPattern === 'headShoulders' && (
            <div className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-xl font-bold bg-gradient-to-r from-teal-200 to-blue-300 bg-clip-text text-transparent">Head and Shoulders Pattern Analysis</h3>
              </div>
              <div className="p-4">
                <HeadAndShouldersDetector symbol={assetData.symbol} />
              </div>
            </div>
          )}
          
          {currentPattern === 'advanced' && (
            <div className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-200 to-indigo-300 bg-clip-text text-transparent">Advanced Pattern Analysis</h3>
              </div>
              <div className="p-4">
                <AdvancedPatternDetector symbol={assetData.symbol} />
              </div>
            </div>
          )}
          
          {currentPattern === 'harmonic' && (
            <div className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-200 to-pink-300 bg-clip-text text-transparent">Harmonic Pattern Analysis</h3>
              </div>
              <div className="p-4">
                <EnhancedHarmonicPatternDetector symbol={assetData.symbol} />
              </div>
            </div>
          )}

{currentPattern === 'chartjs' && (
  <div className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl rounded-xl overflow-hidden">
    <div className="p-4 border-b border-white/10">
      <h3 className="text-xl font-bold bg-gradient-to-r from-green-200 to-emerald-300 bg-clip-text text-transparent">Chart.js Pattern Analysis</h3>
    </div>
    <div className="p-4">
      <ChartPatternVisualizer symbol={assetData.symbol} />
    </div>
  </div>
)}
          
          {/* If no specific pattern is selected, show all */}
          {!currentPattern && (
            <>
              {/* Classic Pattern Detection */}
              <div className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-amber-200 to-orange-300 bg-clip-text text-transparent">Classic Chart Pattern Analysis</h3>
                </div>
                <div className="p-4">
                  <EnhancedClassicPatternDetector symbol={assetData.symbol} />
                </div>
              </div>
              
              {/* Head and Shoulders Pattern Section */}
              <div className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-teal-200 to-blue-300 bg-clip-text text-transparent">Head and Shoulders Pattern Analysis</h3>
                </div>
                <div className="p-4">
                  <HeadAndShouldersDetector symbol={assetData.symbol} />
                </div>
              </div>
              
              {/* Advanced Pattern Section */}
              <div className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-200 to-indigo-300 bg-clip-text text-transparent">Advanced Pattern Analysis</h3>
                </div>
                <div className="p-4">
                  <AdvancedPatternDetector symbol={assetData.symbol} />
                </div>
              </div>
              
              {/* Harmonic Pattern Section */}
              <div className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-200 to-pink-300 bg-clip-text text-transparent">Harmonic Pattern Analysis</h3>
                </div>
                <div className="p-4">
                  <EnhancedHarmonicPatternDetector symbol={assetData.symbol} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950">
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      <div className="relative">
        <div className="relative p-6 max-w-6xl mx-auto space-y-8">
          {/* Enhanced Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-indigo-500/30 rounded-lg blur-xl opacity-75"></div>
              <h1 className="relative text-4xl font-bold bg-gradient-to-r from-pink-200 via-purple-200 to-indigo-200 bg-clip-text text-transparent 
                          drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-2">
                Asset Analyzer Pro
              </h1>
            </div>
            
            {/* Pattern Analysis Buttons - Moved to top left */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                onClick={() => handlePatternView('classic')}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg"
              >
                <BarChart2 className="mr-2 h-4 w-4" />
                Classic Patterns
              </Button>
              <Button
                onClick={() => handlePatternView('headShoulders')}
                className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-lg"
              >
                <Activity className="mr-2 h-4 w-4" />
                Head & Shoulders
              </Button>
              <Button
                onClick={() => handlePatternView('advanced')}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
              >
                <TrendingUpIcon className="mr-2 h-4 w-4" />
                Advanced Patterns
              </Button>
              <Button
                onClick={() => handlePatternView('harmonic')}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg"
              >
                <Triangle className="mr-2 h-4 w-4" />
                Harmonic Patterns
              </Button>
              <Button
  onClick={() => {
    setCurrentPattern('chartjs');
    setShowPatternAnalysis(true);
  }}
  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
>
  <LineChart className="mr-2 h-4 w-4" />
  Chart.js Patterns
</Button>
            </div>
          </div>

          <div className="transition-all duration-300">
            {/* Navigation Buttons */}
            <div className="flex justify-end mb-4 gap-4">
              <Button
                onClick={() => setShowAnalysis(true)}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
                disabled={!assetData.symbol}
              >
                <LineChart className="mr-2 h-5 w-5" />
                Investment Analysis
              </Button>
              <Button
                onClick={() => setShowProtocol(true)}
                className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                View Investment Protocol
              </Button>
            </div>

            {/* Asset Overview Card with Enhanced Glow */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-lg"></div>
              <CardHeader className="border-b border-white/10 pb-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 
                                flex items-center justify-center shadow-lg relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                                  transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      <span className="text-2xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        {assetData.symbol ? assetData.symbol.charAt(0) : 'A'}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-100 to-indigo-100 bg-clip-text text-transparent">
                        {assetData.symbol || 'Select Asset'}
                      </h2>
                      {assetData.overview?.name && (
                        <p className="text-white/70 font-medium">{assetData.overview.name}</p>
                      )}
                    </div>
                  </div>
                  
                  {assetData.price && (
                    <div className="flex items-center gap-6 bg-white/5 p-4 rounded-xl backdrop-blur-lg border border-white/10 shadow-lg 
                                 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                                  transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      <div className="text-right">
                        <div className="text-white/70 text-sm font-medium">Current Price</div>
                        <div className="text-3xl font-bold text-white tracking-tight">
                          ${parseFloat(assetData.price).toFixed(2)}
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm relative overflow-hidden
                                    ${parseFloat(assetData.change) >= 0 
                                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' 
                                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'}`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                                    transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        {parseFloat(assetData.change) >= 0 ? 
                          <TrendingUp className="h-5 w-5" /> : 
                          <TrendingDown className="h-5 w-5" />
                        }
                        <span className="font-bold">{assetData.changePercent}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="mt-6 relative z-10">
                <div className="space-y-6 relative">
                  {/* Controls Grid with Enhanced Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-white/5 rounded-xl backdrop-blur-lg border border-white/10 relative">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">Asset Type</label>
                      <select 
                        value={assetType} 
                        onChange={handleAssetTypeChange}
                        className="w-full p-3 rounded-xl bg-slate-800 border-purple-500/30 text-white 
                                focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all
                                shadow-[0_0_10px_rgba(147,51,234,0.2)]"
                      >
                        <option value="stock">Stock</option>
                        <option value="crypto">Cryptocurrency</option>
                        <option value="bond">Bond</option>
                      </select>
                    </div>

                    <div className="space-y-2 relative z-10">
                      {renderSearchInput({...searchProps})}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/70">Time Range</label>
                      <div className="flex gap-3">
                        <select
                          value={timeRange}
                          onChange={(e) => setTimeRange(e.target.value)}
                          className="flex-1 p-3 rounded-xl bg-slate-800 border-purple-500/30 text-white/90 placeholder-white/30 
                                  focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all backdrop-blur-lg
                                  shadow-[0_0_10px_rgba(147,51,234,0.2)]"
                        >
                          <option value="7">7 Days</option>
                          <option value="30">30 Days</option>
                          <option value="90">90 Days</option>
                          <option value="180">180 Days</option>
                          <option value="365">1 Year</option>
                          <option value="1825">5 Years</option>
                          <option value="3650">10 Years</option>
                        </select>
                        <Button 
                          onClick={handleUpdateChart}
                          className="relative px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 border-none text-white rounded-xl 
                                   shadow-lg hover:shadow-xl 
                                   transition-all duration-300 hover:from-indigo-700 hover:to-purple-700 overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                                      transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                          Update
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Chart Controls with Glowing Buttons */}
                  <div className="flex justify-end gap-4 items-center p-4 bg-white/5 rounded-xl backdrop-blur-lg border border-white/10">
                    {assetType === 'bond' && (
                      <div className="flex-1">
                        <select
                          value={yAxisMetric}
                          onChange={(e) => setYAxisMetric(e.target.value)}
                          className="w-full p-3 rounded-xl bg-slate-800 border-purple-500/30 text-white/90 placeholder-white/30 
                                  focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all backdrop-blur-lg
                                  shadow-[0_0_10px_rgba(147,51,234,0.2)]"
                        >
                          <option value="price">Show Price</option>
                          <option value="yield">Show Yield</option>
                        </select>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant={chartType === 'line' ? 'default' : 'outline'}
                        onClick={() => setChartType('line')}
                        className={`relative px-6 py-2 rounded-xl overflow-hidden group ${
                          chartType === 'line' 
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl' 
                            : 'border-white/20 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                                    transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        Line Chart
                      </Button>
                      <Button
                        variant={chartType === 'area' ? 'default' : 'outline'}
                        onClick={() => setChartType('area')}
                        className={`relative px-6 py-2 rounded-xl overflow-hidden group ${
                          chartType === 'area' 
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl' 
                            : 'border-white/20 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                                    transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        Area Chart
                      </Button>
                    </div>
                  </div>

                  {/* Enhanced Alerts */}
                  {error && (
                    <div className="flex items-center gap-3 p-4 text-rose-300 bg-rose-500/10 rounded-xl border border-rose-500/20 
                                backdrop-blur-sm relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-500/5 to-transparent 
                                  transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">{error}</span>
                    </div>
                  )}
                  
                  {loading && (
                    <div className="flex items-center justify-center gap-3 p-4 text-blue-300 bg-blue-500/10 rounded-xl 
                                border border-blue-500/20 backdrop-blur-sm relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent 
                                  transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-b-transparent border-blue-300"></div>
                      <span className="font-medium">Loading asset data...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Data Display Grid with Enhanced Cards */}
            {(assetData.price || assetData.overview) && (
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6" style={{ zIndex: 1 }}>
                {/* Market Data Card */}
                <Card className="xl:col-span-1 bg-white/5 backdrop-blur-lg border-white/10 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-lg"></div>
                  <CardHeader className="border-b border-white/10 relative z-10">
                    <CardTitle className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 rounded-lg blur-xl opacity-75"></div>
                      <span className="relative text-2xl font-bold bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                        Market Data
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 relative z-10">
                    <div className="divide-y divide-white/10">
                      {/* Show stock-specific data */}
                      {assetType === 'stock' && (
                        <>
                          <div className="flex justify-between py-3 px-6 hover:bg-white/5 transition-colors group">
                            <span className="text-white/60 group-hover:text-white/70 transition-colors">Symbol</span>
                            <span className="font-medium text-white/90 group-hover:text-white transition-colors">
                              {assetData.symbol}
                            </span>
                          </div>
                          <div className="flex justify-between py-3 px-6 hover:bg-white/5 transition-colors group">
                            <span className="text-white/60 group-hover:text-white/70 transition-colors">Name</span>
                            <span className="font-medium text-white/90 group-hover:text-white transition-colors">
                              {assetData.name || assetData.symbol}
                            </span>
                          </div>
                          <div className="flex justify-between py-3 px-6 hover:bg-white/5 transition-colors group">
                            <span className="text-white/60 group-hover:text-white/70 transition-colors">Price</span>
                            <span className="font-medium text-white/90 group-hover:text-white transition-colors">
                              ${parseFloat(assetData.price).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between py-3 px-6 hover:bg-white/5 transition-colors group">
                            <span className="text-white/60 group-hover:text-white/70 transition-colors">Volume</span>
                            <span className="font-medium text-white/90 group-hover:text-white transition-colors">
                              {marketData.volume ? marketData.volume.toLocaleString() : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between py-3 px-6 hover:bg-white/5 transition-colors group">
                            <span className="text-white/60 group-hover:text-white/70 transition-colors">Avg Volume</span>
                            <span className="font-medium text-white/90 group-hover:text-white transition-colors">
                              {marketData.avgVolume ? marketData.avgVolume.toLocaleString() : 'N/A'}
                            </span>
                          </div>
                        </>
                      )}
                      
                      {/* Show crypto-specific data */}
                      {assetType === 'crypto' && assetData.overview && Object.entries(assetData.overview).map(([key, value]) => {
                        if (value === null || value === undefined) return null;
                        
                        const formattedKey = key.replace(/([A-Z])/g, ' $1')
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');

                        let formattedValue = value;
                        if (typeof value === 'number') {
                          if (key.toLowerCase().includes('price') || 
                              key.toLowerCase().includes('value') || 
                              key.toLowerCase().includes('cap') || 
                              key.toLowerCase().includes('volume')) {
                            formattedValue = '$' + value.toLocaleString();
                          } else {
                            formattedValue = value.toLocaleString();
                          }
                        }

                        return (
                          <div key={key} className="flex justify-between py-3 px-6 hover:bg-white/5 transition-colors group">
                            <span className="text-white/60 group-hover:text-white/70 transition-colors">{formattedKey}</span>
                            <span className="font-medium text-white/90 group-hover:text-white transition-colors">{formattedValue}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Chart and Technical Analysis */}
                <div className="xl:col-span-3 space-y-6">
                  <Card className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-blue-500/5 rounded-lg"></div>
                    <CardHeader className="border-b border-white/10 relative z-10">
                      <CardTitle className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-400/20 via-indigo-400/20 to-blue-400/20 rounded-lg blur-xl opacity-75"></div>
                        <span className="relative text-2xl font-bold bg-gradient-to-r from-purple-200 via-indigo-200 to-blue-200 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                          Price Chart
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 relative z-10">
                      <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
                        {renderChart()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-lg"></div>
                    <CardHeader className="border-b border-white/10 relative z-10">
                      <CardTitle className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 rounded-lg blur-xl opacity-75"></div>
                        <span className="relative text-2xl font-bold bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                          Technical Analysis
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 relative z-10">
                      <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
                        {renderTechnicalAnalysis()}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pattern Analysis Sections (hidden by default) */}
                  {assetData.symbol && (
                    <>
                      {/* Classic Pattern Detection */}
                      <Card className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-red-500/5 rounded-lg"></div>
                        <CardHeader 
                          className="border-b border-white/10 cursor-pointer relative z-10"
                          onClick={() => toggleSection('classicPatterns')}
                        >
                          <div className="flex justify-between items-center">
                            <CardTitle className="relative">
                              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-red-400/20 rounded-lg blur-xl opacity-75"></div>
                              <span className="relative text-2xl font-bold bg-gradient-to-r from-amber-200 via-orange-200 to-red-200 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                                Classic Chart Patterns
                              </span>
                            </CardTitle>
                            {expandedSections.classicPatterns ? 
                              <ChevronUp className="h-5 w-5 text-white/70" /> : 
                              <ChevronDown className="h-5 w-5 text-white/70" />
                            }
                          </div>
                        </CardHeader>
                        {expandedSections.classicPatterns && (
                          <CardContent className="p-6 relative z-10">
                            <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10 relative overflow-hidden group">
                              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-red-500/5"></div>
                              <EnhancedClassicPatternDetector symbol={assetData.symbol} />
                            </div>
                          </CardContent>
                        )}
                      </Card>

                      {/* Head and Shoulders Pattern - Collapsible */}
                      <Card className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-cyan-500/5 to-blue-500/5 rounded-lg"></div>
                        <CardHeader 
                          className="border-b border-white/10 cursor-pointer relative z-10"
                          onClick={() => toggleSection('headAndShoulders')}
                        >
                          <div className="flex justify-between items-center">
                            <CardTitle className="relative">
                              <div className="absolute -inset-1 bg-gradient-to-r from-teal-400/20 via-cyan-400/20 to-blue-400/20 rounded-lg blur-xl opacity-75"></div>
                              <span className="relative text-2xl font-bold bg-gradient-to-r from-teal-200 via-cyan-200 to-blue-200 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                                Head & Shoulders Pattern
                              </span>
                            </CardTitle>
                            {expandedSections.headAndShoulders ? 
                              <ChevronUp className="h-5 w-5 text-white/70" /> : 
                              <ChevronDown className="h-5 w-5 text-white/70" />
                            }
                          </div>
                        </CardHeader>
                        {expandedSections.headAndShoulders && (
                          <CardContent className="p-6 relative z-10">
                            <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10 relative overflow-hidden group">
                              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-cyan-500/5 to-blue-500/5"></div>
                              <HeadAndShouldersDetector symbol={assetData.symbol} />
                            </div>
                          </CardContent>
                        )}
                      </Card>

                      {/* Advanced Pattern Detection - Collapsible */}
                      <Card className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-violet-500/5 rounded-lg"></div>
                        <CardHeader 
                          className="border-b border-white/10 cursor-pointer relative z-10"
                          onClick={() => toggleSection('advancedPatterns')}
                        >
                          <div className="flex justify-between items-center">
                            <CardTitle className="relative">
                              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-violet-400/20 rounded-lg blur-xl opacity-75"></div>
                              <span className="relative text-2xl font-bold bg-gradient-to-r from-blue-200 via-indigo-200 to-violet-200 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                                Advanced Pattern Analysis
                              </span>
                            </CardTitle>
                            {expandedSections.advancedPatterns ? 
                              <ChevronUp className="h-5 w-5 text-white/70" /> : 
                              <ChevronDown className="h-5 w-5 text-white/70" />
                            }
                          </div>
                        </CardHeader>
                        {expandedSections.advancedPatterns && (
                          <CardContent className="p-6 relative z-10">
                            <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10 relative overflow-hidden group">
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-violet-500/5"></div>
                              <AdvancedPatternDetector symbol={assetData.symbol} />
                            </div>
                          </CardContent>
                        )}
                      </Card>
                      
                      {/* Harmonic Pattern Detection - Collapsible */}
                      <Card className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-rose-500/5 rounded-lg"></div>
                        <CardHeader 
                          className="border-b border-white/10 cursor-pointer relative z-10"
                          onClick={() => toggleSection('harmonicPatterns')}
                        >
                          <div className="flex justify-between items-center">
                            <CardTitle className="relative">
                              <div className="absolute -inset-1 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-rose-400/20 rounded-lg blur-xl opacity-75"></div>
                              <span className="relative text-2xl font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-rose-200 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                                Harmonic Pattern Analysis
                              </span>
                            </CardTitle>
                            {expandedSections.harmonicPatterns ? 
                              <ChevronUp className="h-5 w-5 text-white/70" /> : 
                              <ChevronDown className="h-5 w-5 text-white/70" />
                            }
                          </div>
                        </CardHeader>
                        {expandedSections.harmonicPatterns && (
                          <CardContent className="p-6 relative z-10">
                            <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10 relative overflow-hidden group">
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-rose-500/5"></div>
                              <EnhancedHarmonicPatternDetector symbol={assetData.symbol} />
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Display;