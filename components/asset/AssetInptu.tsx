"use client"

import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AssetData } from './types';

interface AssetInputProps {
  assetType: string;
  assetData: AssetData;
  loading: boolean;
  error: string;
  onAssetTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSymbolChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDataChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
}

const AssetInput: React.FC<AssetInputProps> = ({
  assetType,
  assetData,
  loading,
  error,
  onAssetTypeChange,
  onSymbolChange,
  onDataChange,
  onAnalyze
}) => {
  return (
    <div className="space-y-4">
      <Select 
        value={assetType} 
        onChange={onAssetTypeChange}
      >
        <SelectItem value="stock">Stock</SelectItem>
        <SelectItem value="crypto">Cryptocurrency</SelectItem>
      </Select>

      <div className="grid grid-cols-3 gap-4">
        <Input
          type="text"
          placeholder="Symbol/Name"
          value={assetData.symbol}
          onChange={onSymbolChange}
          disabled={loading}
        />
        <Input
          type="number"
          placeholder="Current Price"
          value={assetData.price}
          onChange={(e) => onDataChange(e)}
          disabled={loading}
        />
        <Input
          type="number"
          placeholder="Quantity"
          value={assetData.quantity}
          onChange={(e) => onDataChange(e)}
          disabled={loading}
        />
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}
      {loading && (
        <div className="flex justify-center items-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      <Button 
        className="w-full"
        onClick={onAnalyze}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Analyze Asset'}
      </Button>
    </div>
  );
};

export default AssetInput;