import { useState, useMemo } from 'react';
import { Search, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMarketData } from '../../../../hooks/useMarketData';
import { useNavigate } from 'react-router-dom';
import { formatNumber } from '../../../../utils/formatters/numberFormatter';
import MiniSparkline from '../../../../components/common/MiniSparkline';

const SPARK_GREEN = '#22c55e';
const SPARK_RED = '#ef4444';
const SPARK_NEUTRAL = '#facc15';

/* VIOP sparkline'ı için category='VIOP' geçilir — backend chart strategy chain
   VIOP sembollerini doğru source'a route eder. */
export default function ViopDashboard() {
    const { data: contracts, loading: isLoading } = useMarketData('viop');
    const navigate = useNavigate();
    const { t } = useTranslation(['markets', 'common']);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredContracts = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return contracts;
        return contracts.filter(c =>
            (c.symbol && c.symbol.toLowerCase().includes(query)) ||
            (c.name && c.name.toLowerCase().includes(query))
        );
    }, [searchQuery, contracts]);

    const stats = useMemo(() => {
        if (!contracts.length) return { total: 0, gainers: 0, losers: 0 };
        const gainers = contracts.filter(c => (c.changePercent || c.regularMarketChangePercent || 0) > 0).length;
        const losers = contracts.filter(c => (c.changePercent || c.regularMarketChangePercent || 0) < 0).length;
        return { total: contracts.length, gainers, losers };
    }, [contracts]);

    return (
        <div className="min-h-screen bg-bg text-text">
          <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-text tracking-tight flex items-center gap-3">
                        <span className="w-2 h-8 bg-primary rounded-full" />
                        {t('markets:viop.headerTitle')}
                    </h1>
                </div>

                <div className="relative w-full md:w-80">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        type="text"
                        placeholder={t('markets:common.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-surface border border-border focus:border-warning text-text rounded-xl outline-none text-sm transition shadow-lg"
                    />
                </div>
            </div>

            {!isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <KpiCard
                        label={t('markets:viop.contract')}
                        value={stats.total}
                        icon={<Clock size={24} />}
                        iconBg="bg-warning/10 text-warning"
                        valueClass="text-text"
                    />
                    <KpiCard
                        label={t('markets:common.topGainers')}
                        value={stats.gainers}
                        icon={<TrendingUp size={24} />}
                        iconBg="bg-buy/10 text-buy"
                        valueClass="text-buy"
                    />
                    <KpiCard
                        label={t('markets:common.topLosers')}
                        value={stats.losers}
                        icon={<TrendingDown size={24} />}
                        iconBg="bg-sell/10 text-sell"
                        valueClass="text-sell"
                    />
                </div>
            )}

            {isLoading ? (
                <div className="h-96 animate-pulse bg-surface border border-border rounded-2xl" />
            ) : (
                <div className="bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto max-h-150 custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-150">
                            <thead className="bg-surface-2 sticky top-0 z-10 shadow-md">
                            <tr>
                                <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider">
                                    {t('markets:viop.contract')}
                                </th>
                                <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">
                                    {t('markets:viop.settlement')}
                                </th>
                                <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">
                                    {t('markets:stocks.tableCols.changePercent')}
                                </th>
                                <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">
                                    {t('markets:viop.chart', 'Grafik')}
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2a2e39]">
                            {filteredContracts.length > 0 ? (
                                filteredContracts.map((contract) => {
                                    const price = contract.price || contract.regularMarketPrice || 0;
                                    const change = contract.changePercent || contract.regularMarketChangePercent || 0;
                                    const isPositive = change > 0;
                                    const isNegative = change < 0;
                                    const sparkColor = isPositive ? SPARK_GREEN : isNegative ? SPARK_RED : SPARK_NEUTRAL;

                                    return (
                                        <tr
                                            key={contract.symbol}
                                            onClick={() => navigate(`/chart/${encodeURIComponent(contract.symbol)}?cat=VIOP`)}
                                            className="hover:bg-surface-2 transition cursor-pointer"
                                        >
                                            <td className="p-5 whitespace-nowrap">
                                                <span className="font-bold text-text">{contract.symbol}</span>
                                                {contract.name && (
                                                    <span className="text-text-muted text-sm ml-2">
                                                        {contract.name}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-5 text-right font-mono font-medium text-text whitespace-nowrap">
                                                {formatNumber(price, 2, 4)}
                                            </td>
                                            <td className="p-5 text-right whitespace-nowrap">
                                                <span className={`font-bold text-sm ${
                                                    isPositive ? 'text-buy' : isNegative ? 'text-sell' : 'text-text-muted'
                                                }`}>
                                                    {isPositive ? '+' : ''}{change.toFixed(2)}%
                                                </span>
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="inline-block">
                                                    <MiniSparkline
                                                        symbol={contract.symbol}
                                                        color={sparkColor}
                                                        category="VIOP"
                                                        width={100}
                                                        height={32}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-10 text-center text-text-muted">
                                        {t('markets:common.noResults')}
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
          </div>
        </div>
    );
}

function KpiCard({ label, value, icon, iconBg, valueClass }) {
    return (
        <div className="bg-surface border border-border p-5 rounded-xl flex items-center justify-between shadow-lg">
            <div>
                <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
                <h3 className={`text-2xl sm:text-3xl font-black ${valueClass}`}>{value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg}`}>
                {icon}
            </div>
        </div>
    );
}
