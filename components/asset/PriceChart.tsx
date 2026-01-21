import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { HistoricalDataPoint } from './types';

interface PriceChartProps {
  data: HistoricalDataPoint[];
}

const PriceChart: React.FC<PriceChartProps> = ({ data }) => {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price History (90 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <LineChart
            width={800}
            height={400}
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              formatter={(value) => [`$${value}`, "Price"]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#8884d8" 
              dot={false}
              name="Price"
            />
          </LineChart>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceChart;