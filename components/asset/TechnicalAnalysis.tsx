import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Analysis, AssetData } from './types';

interface TechnicalAnalysisProps {
  analysis: Analysis;
  assetData: AssetData;
  assetType: string;
}

const TechnicalAnalysis: React.FC<TechnicalAnalysisProps> = ({
  analysis,
  assetData,
  assetType
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Technical Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Total Value</TableCell>
              <TableCell>${analysis.totalValue}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Current Price</TableCell>
              <TableCell>${parseFloat(assetData.price).toLocaleString()}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{assetType === 'crypto' ? '24h Change' : 'Change'}</TableCell>
              <TableCell className={parseFloat(assetData.change) >= 0 ? 'text-green-600' : 'text-red-600'}>
                ${assetData.change} ({assetData.changePercent}%)
              </TableCell>
            </TableRow>
            {assetData.overview && (
              <>
                <TableRow>
                  <TableCell>Market Cap</TableCell>
                  <TableCell>${parseFloat(assetData.overview.marketCap || '0').toLocaleString()}</TableCell>
                </TableRow>
                {assetType === 'stock' ? (
                  <>
                    <TableRow>
                      <TableCell>P/E Ratio</TableCell>
                      <TableCell>{assetData.overview.pe || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>EPS</TableCell>
                      <TableCell>{assetData.overview.eps || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Beta</TableCell>
                      <TableCell>{assetData.overview.beta || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>52-Week Range</TableCell>
                      <TableCell>${assetData.overview.low52} - ${assetData.overview.high52}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Dividend Yield</TableCell>
                      <TableCell>{assetData.overview.dividend ? `${assetData.overview.dividend}%` : 'N/A'}</TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell>24h Volume</TableCell>
                    <TableCell>${parseFloat(assetData.overview.volume || '0').toLocaleString()}</TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TechnicalAnalysis;