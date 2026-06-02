import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronRight, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { watchlistApi } from '../../../services/api/watchlistApi';
import MiniSparkline from '../../../components/common/MiniSparkline';
import DashboardWidgetCard from './DashboardWidgetCard';

const PRIMARY = '#2962ff';

// assetType -> chart route kategori + sembol normalizasyonu
function chartTarget(symbol, assetType) {
    const cat = assetType || '';
    const chartSymbol = assetType === 'CRYPTO' && !symbol.includes('-USD') ? `${symbol}-USD` : symbol;
    return cat ? `/chart/${encodeURIComponent(chartSymbol)}?cat=${cat}` : `/chart/${encodeURIComponent(chartSymbol)}`;
}

export default function WatchlistWidget() {
    const { t } = useTranslation(['dashboard', 'common']);
    const navigate = useNavigate();

    const { data: items, isLoading } = useQuery({
        queryKey: ['watchlist'],
        queryFn: watchlistApi.getMyWatchlist
    });

    const shellProps = {
        title: t('dashboard:widgets.watchlistTitle'),
        viewAllLabel: t('dashboard:widgets.viewAll'),
        onViewAll: () => navigate('/watchlist')
    };

    if (isLoading) {
        return <DashboardWidgetCard {...shellProps}><div className="h-40 animate-pulse bg-surface-2 rounded-xl" /></DashboardWidgetCard>;
    }

    if (!items || items.length === 0) {
        return (
            <DashboardWidgetCard {...shellProps}>
                <div className="py-8 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                        <Star size={26} />
                    </div>
                    <h3 className="text-base font-bold text-text">{t('dashboard:widgets.emptyWatchlistTitle')}</h3>
                    <p className="text-text-muted text-sm mt-1 max-w-xs">{t('dashboard:widgets.emptyWatchlistDesc')}</p>
                    <button
                        onClick={() => navigate('/markets/live')}
                        className="mt-5 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-fg rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
                    >
                        {t('dashboard:widgets.emptyWatchlistCta')} <ArrowRight size={16} />
                    </button>
                </div>
            </DashboardWidgetCard>
        );
    }

    return (
        <DashboardWidgetCard {...shellProps}>
            <div className="divide-y divide-border/50">
                {items.slice(0, 6).map((item, i) => {
                    const symbol = item.symbol || item.currencyCode || '';
                    return (
                        <div
                            key={item.id || item.itemId || `${symbol}-${i}`}
                            onClick={() => navigate(chartTarget(symbol, item.assetType))}
                            className="flex items-center gap-3 py-3 cursor-pointer group hover:bg-surface-hover -mx-2 px-2 rounded-lg transition-colors"
                        >
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-bold text-text group-hover:text-primary transition-colors">
                                    {symbol.replace('-USD', '')}
                                </span>
                                <span className="text-[10px] text-text-muted truncate max-w-40">
                                    {item.name || item.currencyName || item.assetType}
                                </span>
                            </div>
                            <MiniSparkline symbol={symbol} category={item.assetType} color={PRIMARY} width={70} height={28} />
                            <ChevronRight size={16} className="shrink-0 text-border group-hover:text-primary transition-colors" />
                        </div>
                    );
                })}
            </div>
        </DashboardWidgetCard>
    );
}
