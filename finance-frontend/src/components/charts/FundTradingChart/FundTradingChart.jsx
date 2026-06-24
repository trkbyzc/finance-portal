import { useState } from 'react';
import { useFundChartData } from '../../../hooks/charts/useFundChartData';
import FundHeader from './components/FundHeader';
import FundRangeSelector from './components/FundRangeSelector';
import FundChartArea from './components/FundChartArea';

export default function FundTradingChart({ asset }) {
    const [range, setRange] = useState('1y');

    const symbol = asset?.symbol || asset?.yahooSymbol;
    // SPY/QQQ FUND kategorisinde olsa da TEFAS'ta bulunmaz; bunlar Yahoo Finance'ten çekilir
    const isTefas = asset?.assetCategory === 'FUND' && !symbol?.includes('SPY') && !symbol?.includes('QQQ');

    const { data: chartData = [], isLoading: loading } = useFundChartData(symbol, range, isTefas);

    return (
        <div className="flex flex-col w-full h-full bg-bg text-text rounded-2xl overflow-hidden">
            <FundHeader symbol={symbol} isTefas={isTefas} asset={asset} chartData={chartData} />
            <FundRangeSelector range={range} setRange={setRange} />
            <FundChartArea chartData={chartData} loading={loading} />
        </div>
    );
}