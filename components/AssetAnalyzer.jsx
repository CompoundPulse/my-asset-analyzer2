import React, { useState, BookOpen, useCallback, useMemo, useEffect } from 'react';
import TVChart from './TVChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { cryptoMap } from './cryptoMap';
import {
    fetchStockData,
    stockSymbols,
    handleStockFetch,
    calculateTechnicalIndicators,
    generateTechnicalAnalysis,
    formatStockHistoricalData
} from './stockUtils';
import {
    bondCategories,
    bondSymbols,
    categoryMetadata,
    fetchBondData,
    fetchBondHistoricalData
} from './bondUtils';
import { renderSearchInput } from './searchComponents';
import Display from './Display';
import InvestmentProtocol from './InvestmentProtocol';

const AssetAnalyzer = () => {
    // Put all useState declarations together at the top of the component
    const [assetType, setAssetType] = useState('stock');
    const [selectedBondCategory, setSelectedBondCategory] = useState('');
    const [assetData, setAssetData] = useState({
        symbol: '',
        price: '',
        change: '',
        changePercent: '',
        overview: null
    });
    const [marketData, setMarketData] = useState({
        volume: 0,
        avgVolume: 0
    });

    const [financialData, setFinancialData] = useState({
        eps: null,
        totalDebt: null,
        totalEquity: null,
        currentAssets: null,
        currentLiabilities: null
    });
    const [initialBondData, setInitialBondData] = useState(null);  // Move it here
    const [historicalData, setHistoricalData] = useState({
        prices: [],
        technical: null,
        analysis: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timeRange, setTimeRange] = useState('90');
    const [chartType, setChartType] = useState('line');
    const [yAxisMetric, setYAxisMetric] = useState('price');

    const fetchCryptoData = useCallback(async (symbol) => {
        try {
            setLoading(true);
            setError('');

            // Get current price and stats
            const response = await fetch(`/api/crypto?symbol=${symbol}&type=ticker`);
            if (!response.ok) throw new Error('Failed to fetch ticker data');
            const data = await response.json();

            setAssetData({
                symbol,
                price: data.price.toString(),
                change: parseFloat(data.change).toFixed(2),
                changePercent: parseFloat(data.changePercent).toFixed(2),
                overview: {
                    name: cryptoMap[symbol] ? cryptoMap[symbol].split('-').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ') : symbol,
                    volume: parseFloat(data.stats.vol),
                    high24h: parseFloat(data.stats.high),
                    low24h: parseFloat(data.stats.low),
                    volValue: parseFloat(data.stats.volValue)
                }
            });

            setMarketData({
                volume: parseFloat(data.stats.vol),
                avgVolume: parseFloat(data.stats.avgVol || data.stats.vol)
            });

            // If you have access to financial data in your API response
            setFinancialData({
                eps: data.financials?.eps || null,
                totalDebt: data.financials?.totalDebt || null,
                totalEquity: data.financials?.totalEquity || null,
                currentAssets: data.financials?.currentAssets || null,
                currentLiabilities: data.financials?.currentLiabilities || null
            });


            // Get historical data
            const historyResponse = await fetch(`/api/crypto?symbol=${symbol}&type=kline&timeRange=${timeRange}`);
            if (!historyResponse.ok) throw new Error('Failed to fetch historical data');
            const historyData = await historyResponse.json();

            if (historyData.data) {
                const dailyData = historyData.data.map(k => ({
                    date: new Date(parseInt(k[0]) * 1000).toISOString().split('T')[0],
                    value: parseFloat(k[2]),
                    volume: parseFloat(k[5]),
                    open: parseFloat(k[1]),
                    high: parseFloat(k[3]),
                    low: parseFloat(k[4])
                }));

                dailyData.sort((a, b) => new Date(a.date) - new Date(b.date));

                setHistoricalData({
                    prices: dailyData,
                    technical: calculateTechnicalIndicators(dailyData),
                    analysis: null
                });
            }

        } catch (error) {
            console.error('Error fetching crypto:', error);
            setError('Failed to fetch cryptocurrency data');
        } finally {
            setLoading(false);
        }
    }, [timeRange]);

    const handleBondFetch = useCallback(async (symbol) => {
        try {
            setLoading(true);
            setError('');

            if (!initialBondData || initialBondData.symbol !== symbol) {
                const bondData = await fetchBondData(symbol);
                setAssetData(bondData);
                setInitialBondData(bondData);
            }

            const historicalData = await fetchBondHistoricalData(symbol, timeRange, initialBondData);

            // Simplify to match stock format exactly
            const formattedData = historicalData.map(point => ({
                date: point.date,
                value: parseFloat(point.value) // Ensure it's a number
            })).filter(point => point.date && !isNaN(point.value));

            console.log("Bond formatted data:", formattedData); // Debug log

            setHistoricalData({
                prices: formattedData,
                technical: calculateTechnicalIndicators(formattedData),
                analysis: null
            });

        } catch (error) {
            console.error('Error fetching bond:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [timeRange, initialBondData]); // Remove yAxisMetric since we're not using it here

    // Add this new function right after handleBondFetch
    const updateHistoricalData = useCallback(async () => {
        if (!assetData.symbol || !initialBondData) return;

        try {
            const historicalData = await fetchBondHistoricalData(assetData.symbol, timeRange, initialBondData);
            setHistoricalData(historicalData);
        } catch (error) {
            console.error('Error updating historical data:', error);
        }
    }, [assetData.symbol, timeRange, initialBondData]);

    // Add this useEffect right after the updateHistoricalData function
    useEffect(() => {
        if (assetData.symbol) {
            updateHistoricalData();
        }
    }, [timeRange, updateHistoricalData]);

    const handleTimeRangeChange = (e) => {
        const newTimeRange = e.target.value;
        setTimeRange(newTimeRange);
        // Removed the redundant fetching logic here
    };

    // Add this function right after your other useCallback functions
    const handleUpdateChart = useCallback(() => {
        if (assetData.symbol) {
            switch (assetType) {
                case 'stock':
          handleStockFetch(assetData.symbol, timeRange, {
            setLoading,
            setError,
            setAssetData,
            setHistoricalData
          });
          break;
                case 'crypto':
                    fetchCryptoData(assetData.symbol);
                    break;
                case 'bond':
                    handleBondFetch(assetData.symbol);
                    break;
            }
        }
    }, [assetType, assetData.symbol, handleStockFetch, fetchCryptoData, handleBondFetch]);

    const priceChangeColor = useMemo(() => {
        const change = parseFloat(assetData.change);
        return change >= 0 ? 'text-green-600' : 'text-red-600';
    }, [assetData.change]);

    const handleAssetTypeChange = (e) => {
        const newType = e.target.value;
        setAssetType(newType);
        setSelectedBondCategory('');
        setAssetData({
            symbol: '',
            price: '',
            change: '',
            changePercent: '',
            overview: null
        });
        setHistoricalData([]);
        setError('');
        setInitialBondData(null);  // Add this line
        setYAxisMetric(newType === 'bond' ? 'yield' : 'price');
    };

    const handleSymbolChange = useCallback((e) => {
        const newSymbol = e.target.value.toUpperCase();
        setAssetData(prev => ({ ...prev, symbol: newSymbol }));

        if (newSymbol.length > 0) {
            switch (assetType) {
                case 'stock':
          handleStockFetch(newSymbol, timeRange, {
            setLoading,
            setError,
            setAssetData,
            setHistoricalData
          });
          break;
                case 'crypto':
                    fetchCryptoData(newSymbol);
                    break;
                case 'bond':
                    handleBondFetch(newSymbol);
                    break;
            }
        }
    }, [assetType, timeRange, fetchCryptoData, handleBondFetch]); // Add other dependencies if needed

    const renderChart = () => {
        if (!historicalData?.prices || !Array.isArray(historicalData.prices) || historicalData.prices.length === 0) {
            return (
                <div style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4C525E', fontSize: 13 }}>
                    No data to display. Search for an asset above.
                </div>
            );
        }
        return (
            <TVChart
                data={historicalData.prices}
                type={chartType}
                assetType={assetType}
                yAxisMetric={yAxisMetric}
                height={380}
            />
        );
    };

    const renderTechnicalAnalysis = () => {
        if (!historicalData?.technical) return null;

        const formatValue = (value) => {
            return typeof value === 'number' ? value.toFixed(2) : 'N/A';
        };

        return (
            <div className="w-full">
                <table className="min-w-full">
                    <tbody className="bg-transparent">
                        {/* Moving Averages */}
                        <tr className="border-b border-white/10">
                            <td className="px-6 py-4 text-white/70">SMA 50</td>
                            <td className="px-6 py-4 text-right text-white">
                                ${formatValue(historicalData.technical.movingAverages.sma50)}
                            </td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="px-6 py-4 text-white/70">SMA 200</td>
                            <td className="px-6 py-4 text-right text-white">
                                ${formatValue(historicalData.technical.movingAverages.sma200)}
                            </td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="px-6 py-4 text-white/70">EMA 20</td>
                            <td className="px-6 py-4 text-right text-white">
                                ${formatValue(historicalData.technical.movingAverages.ema20)}
                            </td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="px-6 py-4 text-white/70">DEMA 14</td>
                            <td className="px-6 py-4 text-right text-white">
                                ${formatValue(historicalData.technical.movingAverages.dema14)}
                            </td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="px-6 py-4 text-white/70">TEMA 14</td>
                            <td className="px-6 py-4 text-right text-white">
                                ${formatValue(historicalData.technical.movingAverages.tema14)}
                            </td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="px-6 py-4 text-white/70">VWAP</td>
                            <td className="px-6 py-4 text-right text-white">
                                ${formatValue(historicalData.technical.movingAverages.vwap)}
                            </td>
                        </tr>

                        {/* Momentum */}
                        <tr className="border-b border-white/10">
                            <td className="px-6 py-4 text-white/70">RSI</td>
                            <td className="px-6 py-4 text-right text-white">
                                {formatValue(historicalData.technical.momentum.rsi)}
                            </td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="px-6 py-4 text-white/70">MACD</td>
                            <td className="px-6 py-4 text-right text-white">
                                {formatValue(historicalData.technical.momentum.macd)}
                            </td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="px-6 py-4 text-white/70">Stoch %K</td>
                            <td className="px-6 py-4 text-right text-white">
                                {formatValue(historicalData.technical.momentum.stochK)}
                            </td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="px-6 py-4 text-white/70">Stoch %D</td>
                            <td className="px-6 py-4 text-right text-white">
                                {formatValue(historicalData.technical.momentum.stochD)}
                            </td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="px-6 py-4 text-white/70">CCI</td>
                            <td className="px-6 py-4 text-right text-white">
                                {formatValue(historicalData.technical.momentum.cci)}
                            </td>
                        </tr>

                        {/* Volatility */}
                        <tr className="border-b border-white/10">
                            <td className="px-6 py-4 text-white/70">Bollinger Upper</td>
                            <td className="px-6 py-4 text-right text-white">
                                ${formatValue(historicalData.technical.volatility.bollingerUpper)}
                            </td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="px-6 py-4 text-white/70">Bollinger Lower</td>
                            <td className="px-6 py-4 text-right text-white">
                                ${formatValue(historicalData.technical.volatility.bollingerLower)}
                            </td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="px-6 py-4 text-white/70">ATR</td>
                            <td className="px-6 py-4 text-right text-white">
                                ${formatValue(historicalData.technical.volatility.atr)}
                            </td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="px-6 py-4 text-white/70">Keltner Upper</td>
                            <td className="px-6 py-4 text-right text-white">
                                ${formatValue(historicalData.technical.volatility.keltnerUpper)}
                            </td>
                        </tr>

                        {/* Volume */}
                        <tr className="border-b border-white/10">
                            <td className="px-6 py-4 text-white/70">OBV</td>
                            <td className="px-6 py-4 text-right text-white">
                                {formatValue(historicalData.technical.volume.obv)}
                            </td>
                        </tr>
                        <tr className="border-b border-white/10">
                            <td className="px-6 py-4 text-white/70">Chaikin Osc</td>
                            <td className="px-6 py-4 text-right text-white">
                                {formatValue(historicalData.technical.volume.chaikinOsc)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )
    }

    return (
        <Display
            assetData={assetData}
            assetType={assetType}
            selectedBondCategory={selectedBondCategory}
            timeRange={timeRange}
            chartType={chartType}
            yAxisMetric={yAxisMetric}
            loading={loading}
            error={error}
            priceChangeColor={priceChangeColor}
            handleAssetTypeChange={handleAssetTypeChange}
            handleUpdateChart={handleUpdateChart}
            setTimeRange={setTimeRange}
            setChartType={setChartType}
            setYAxisMetric={setYAxisMetric}
            renderSearchInput={renderSearchInput}
            renderChart={renderChart}
            renderTechnicalAnalysis={renderTechnicalAnalysis}
            searchProps={{
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
            }}
            // Add just these new props:
            historicalData={historicalData}
            marketData={marketData}
            financialData={financialData}
        />
    );
};

export default AssetAnalyzer;