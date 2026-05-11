import React, { useState } from 'react';
import { useFundChartData } from '../../../hooks/charts/useFundChartData';
import FundHeader from './components/FundHeader';
import FundRangeSelector from './components/FundRangeSelector';
import FundChartArea from './components/FundChartArea';

// 🚀 FAZA 1: useEffect ve axios kaldırıldı, custom hook kullanılıyor
export default function FundTradingChart({ asset }) {
    const [range, setRange] = useState('1y');

    const symbol = asset?.symbol || asset?.yahooSymbol;
    // Orijinal ayrım mantığın
    const isTefas = asset?.assetCategory === 'FUND' && !symbol?.includes('SPY') && !symbol?.includes('QQQ');

    // ✅ React Query ile veri çekme
    const { data: chartData = [], isLoading: loading } = useFundChartData(symbol, range, isTefas);

    return (
        <div className="flex flex-col w-full h-full bg-[#0b0e14] text-white rounded-2xl overflow-hidden">
            <FundHeader symbol={symbol} isTefas={isTefas} asset={asset} chartData={chartData} />
            <FundRangeSelector range={range} setRange={setRange} />
            <FundChartArea chartData={chartData} loading={loading} />
        </div>
    );
}