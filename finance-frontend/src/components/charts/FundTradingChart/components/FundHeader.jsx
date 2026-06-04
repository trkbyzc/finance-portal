import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../../../utils/formatters/numberFormatter';

export default function FundHeader({ symbol, isTefas, asset, chartData }) {
    const { t } = useTranslation(['common', 'asset']);
    const fallbackPrice = asset?.price || asset?.lastPrice || asset?.forexBuying || 0;
    const lastPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : fallbackPrice;
    const isPositive = asset?.changePercent >= 0;

    return (
        <div className="p-6 bg-surface border-b border-border flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-text uppercase tracking-tight flex items-center gap-2">
                    {symbol?.replace('.IS', '')}
                    {isTefas ? (
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded border border-primary/30">TEFAS</span>
                    ) : (
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded border border-primary/30">ETF</span>
                    )}
                </h1>
                <div className="text-sm text-text-muted mt-1">{asset?.name || asset?.currencyName}</div>
            </div>

            <div className="text-right">
                <div className="text-3xl font-mono font-bold text-text">
                    {isTefas ? '₺' : '$'}
                    {formatNumber(lastPrice, 4, 4)}
                </div>
                <div className={`font-mono font-bold text-sm ${isPositive ? 'text-buy' : 'text-sell'}`}>
                    {isPositive ? '+' : ''}{Number(asset?.changePercent || 0).toFixed(2)}%
                    <span className="text-text-muted text-[10px] ml-1">({t('common:labels.change')})</span>
                </div>
            </div>
        </div>
    );
}
