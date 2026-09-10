import { PieChart, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../../../../utils/formatters/numberFormatter';

export default function MiniListsSection({ data, category, navigate }) {
    const { t } = useTranslation(['markets', 'common']);

    if (category === 'tr-funds') {
        return (
            <div className="p-8 grid md:grid-cols-3 gap-8">
                <MiniList title={t('common:status.live') + ' ' + t('markets:common.topGainers')} data={[...data].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)).slice(0, 5)} navigate={navigate} />
                <MiniList title={t('markets:common.topLosers')} data={[...data].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0)).slice(0, 5)} navigate={navigate} />

                <div className="bg-surface p-6 rounded-2xl border border-border shadow-lg flex flex-col justify-center">
                    <h3 className="font-bold text-lg text-text mb-4 flex items-center gap-2">
                        <PieChart className="text-primary" size={24} /> {t('markets:funds.trHeaderTitle')}
                    </h3>
                    <p className="text-sm text-text-muted leading-relaxed mb-6">
                        {t('markets:funds.trHeaderSubtitle')}
                    </p>
                    <div className="bg-surface-2 p-3 rounded-xl border border-border flex gap-3 items-start">
                        <Info className="text-warning shrink-0" size={18} />
                        <div className="flex flex-col">
                            <span className="text-xs text-text font-bold">{t('common:footer.disclaimer')}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 grid md:grid-cols-3 gap-8">
            <MiniList title={t('markets:common.mostActive')} data={data.slice(0, 5)} navigate={navigate} />
            <MiniList title={t('markets:common.topGainers')} data={[...data].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)).slice(0, 5)} navigate={navigate} />
            <MiniList title={t('markets:common.topLosers')} data={[...data].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0)).slice(0, 5)} navigate={navigate} />
        </div>
    );
}

function MiniList({ title, data, navigate }) {
    if (!data || data.length === 0) return null;

    return (
        <div className="space-y-4 bg-surface p-5 rounded-2xl border border-border shadow-lg">
            <h3 className="font-bold text-base flex justify-between items-center group text-text pb-2 border-b border-border/50">
                {title}
            </h3>
            <div className="space-y-1">
                {data.map((item, i) => {
                    const symbol = item.symbol || item.currencyCode || item.yahooSymbol;
                    const isFund = item.assetCategory === 'FUND';

                    return (
                        <div key={i} onClick={() => navigate(`/chart/${encodeURIComponent(symbol)}?cat=${isFund ? 'FUND' : 'CURRENCY'}`)} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-2 transition-colors cursor-pointer group">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold uppercase text-text group-hover:text-text">
                                    {symbol.replace('-USD', '').replace('.IS', '')}
                                </span>
                                <span className="text-[10px] text-text-muted truncate w-32">{item.name || item.currencyName}</span>
                            </div>
                            <div className="text-right">
                                {!isFund && (
                                    <div className="text-xs font-mono font-bold text-text">{formatNumber(item.price || item.forexSelling)}</div>
                                )}
                                <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block ${!isFund ? 'mt-1' : ''} ${item.changePercent >= 0 ? 'text-buy bg-buy/10' : 'text-sell bg-sell/10'}`}>
                                    {item.changePercent > 0 ? '+' : ''}{(item.changePercent || 0).toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
