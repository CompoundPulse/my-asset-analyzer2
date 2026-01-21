// Debug.jsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// Simple debug logging
export const logAnalysis = (type, data) => {
  console.group(`Analysis: ${type}`);
  console.log('Data:', data);
  console.groupEnd();
};

// Debug panel component
const DebugPanel = ({ marketData, historicalData, financialData }) => {
  return (
    <Card className="w-full bg-black/20 backdrop-blur-sm border-white/10 mt-4">
      <CardHeader>
        <CardTitle className="text-xl text-white">Debug Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <DebugSection 
            title="Financial Data" 
            data={{
              hasRawData: Boolean(financialData?._raw),
              financialDataKeys: financialData?._raw?.financialData ? Object.keys(financialData._raw.financialData) : [],
              keyStatsKeys: financialData?._raw?.keyStats ? Object.keys(financialData._raw.keyStats) : []
            }} 
          />
          
          <DebugSection 
            title="Historical Data" 
            data={{
              dataPoints: historicalData?.length || 0,
              recentSample: historicalData?.slice(-3) || []
            }} 
          />
          
          <DebugSection 
            title="Market Data" 
            data={marketData} 
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Helper component for each debug section
const DebugSection = ({ title, data }) => (
  <div className="bg-black/40 p-4 rounded-lg">
    <h3 className="text-white/90 font-semibold mb-2">{title}:</h3>
    <pre className="text-white/70 text-sm overflow-auto max-h-40">
      {JSON.stringify(data, null, 2)}
    </pre>
  </div>
);

export default DebugPanel;