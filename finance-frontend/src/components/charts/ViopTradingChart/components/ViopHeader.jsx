import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../../../utils/formatters/numberFormatter';

export default function ViopHeader({ asset }) {
    const { t } = useTranslation(['common']);

    const calculateRealFark = () => {
        if (!asset?.price || !asset?.changePercent) return "0.00";
        const prevClose = asset.price / (1 + (asset.changePercent / 100));
        const fark = asset.price - prevClose;
        return fark.toFixed(2);
    };

    const isPositive = asset?.changePercent >= 0;
    const trendClass = isPositive ? 'text-buy' : 'text-sell';

    return (
        <div className="p-6 bg-surface border-b border-border">
            <h1 className="text-2xl font-bold text-text mb-4 uppercase tracking-tight">
                {asset?.name || asset?.symbol}
            </h1>

            <div className="flex items-center gap-10 flex-wrap">
                <div>
                    <div className={`text-4xl font-mono font-bold ${trendClass}`}>
                        {formatNumber(asset?.price, 4, 4)}
                    </div>
                </div>

                <div className="text-left">
                    <div className="text-text-muted text-[10px] uppercase font-bold mb-1 tracking-wider">{t('labels.change')}</div>
                    <div className={`font-mono font-bold ${trendClass}`}>
                        {calculateRealFark()}
                    </div>
                </div>

                <div className="text-left">
                    <div className="text-text-muted text-[10px] uppercase font-bold mb-1 tracking-wider">{t('labels.changePercent')}</div>
                    <div className={`font-mono font-bold ${trendClass}`}>
                        {asset?.changePercent > 0 ? '+' : ''}{asset?.changePercent?.toFixed(2)}%
                    </div>
                </div>
            </div>
        </div>
    );
}
