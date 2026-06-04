import { useMemo } from 'react';
import { Layers, Activity, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMarketData } from '../../../../../hooks/useMarketData.js';

/**
 * BIST üst KPI kartları — 3 metrik:
 *   1. Listed Stocks: BIST'te aktif hisse sayısı
 *   2. Market Direction: gainers vs losers'a göre Bullish/Bearish + ortalama günlük değişim %
 *   3. Gainers/Losers Ratio: oran şeklinde (örn. 2.5:1) — equal/all-down edge case'leri için "-" gösterir
 */
export default function BistInfoCards() {
    const { data: stocks, loading: isLoading } = useMarketData('tr-stocks');
    const { t } = useTranslation('markets');

    const stats = useMemo(() => {
        if (!stocks.length) return { gainers: 0, losers: 0, total: 0, trend: 'NEUTRAL', avgChange: 0, ratio: '-' };

        let gainers = 0, losers = 0, sumChange = 0, withChange = 0;
        for (const s of stocks) {
            const ch = s.changePercent ?? s.regularMarketChangePercent ?? 0;
            if (ch > 0) gainers++;
            else if (ch < 0) losers++;
            if (ch !== 0) {
                sumChange += ch;
                withChange++;
            }
        }

        const avgChange = withChange > 0 ? sumChange / withChange : 0;
        // Ratio: gainers/losers veya tersi (büyük olan başa). Edge case'ler için "-"
        let ratio = '-';
        if (gainers > 0 && losers > 0) {
            ratio = gainers >= losers
                ? `${(gainers / losers).toFixed(1)} : 1`
                : `1 : ${(losers / gainers).toFixed(1)}`;
        } else if (gainers > 0 && losers === 0) {
            ratio = `${gainers} : 0`;
        } else if (losers > 0 && gainers === 0) {
            ratio = `0 : ${losers}`;
        }

        return {
            gainers, losers,
            total: stocks.length,
            trend: gainers > losers ? 'BULL' : losers > gainers ? 'BEAR' : 'NEUTRAL',
            avgChange,
            ratio
        };
    }, [stocks]);

    if (isLoading) return <div className="h-24 animate-pulse bg-surface rounded-xl mb-8 border border-border"></div>;

    const directionColor = stats.trend === 'BULL' ? 'text-buy' : stats.trend === 'BEAR' ? 'text-sell' : 'text-text-muted';
    const directionBg = stats.trend === 'BULL' ? 'bg-buy/10 text-buy' : stats.trend === 'BEAR' ? 'bg-sell/10 text-sell' : 'bg-surface-hover text-text-muted';
    const directionLabel = stats.trend === 'BULL' ? t('stocks.bullish') : stats.trend === 'BEAR' ? t('stocks.bearish') : '—';
    const avgSign = stats.avgChange > 0 ? '+' : '';

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {/* 1. Listed Stocks */}
            <KpiCard
                label={t('stocks.listedStocks')}
                value={stats.total.toLocaleString('tr-TR')}
                icon={<Layers size={22} />}
                iconClass="bg-primary/10 text-primary"
            />

            {/* 2. Market Direction with avg % */}
            <div className="bg-surface border border-border p-5 rounded-xl flex items-center justify-between shadow-lg">
                <div className="min-w-0">
                    <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">
                        {t('stocks.marketDirection')}
                    </p>
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <h3 className={`text-xl sm:text-2xl font-black ${directionColor}`}>{directionLabel}</h3>
                        <span className={`text-sm font-mono font-bold ${directionColor}`}>
                            ({avgSign}{stats.avgChange.toFixed(2)}%)
                        </span>
                    </div>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${directionBg}`}>
                    <Activity size={22} />
                </div>
            </div>

            {/* 3. Gainers/Losers Ratio */}
            <KpiCard
                label={t('stocks.gainersLosersRatio', 'Yükselen / Düşen')}
                value={stats.ratio}
                valueClass={stats.trend === 'BULL' ? 'text-buy' : stats.trend === 'BEAR' ? 'text-sell' : 'text-text'}
                icon={<Scale size={22} />}
                iconClass="bg-warning/10 text-warning"
            />
        </div>
    );
}

function KpiCard({ label, value, valueClass = 'text-text', icon, iconClass }) {
    return (
        <div className="bg-surface border border-border p-5 rounded-xl flex items-center justify-between shadow-lg">
            <div className="min-w-0">
                <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
                <h3 className={`text-xl sm:text-2xl font-black ${valueClass}`}>{value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconClass}`}>
                {icon}
            </div>
        </div>
    );
}
