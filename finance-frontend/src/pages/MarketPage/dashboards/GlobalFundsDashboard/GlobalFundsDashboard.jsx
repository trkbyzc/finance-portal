import { useMarketData } from '../../../../hooks/useMarketData';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../../../utils/formatters/numberFormatter';

export default function GlobalFundsDashboard() {
    const navigate = useNavigate();
    const { data: etfs } = useMarketData('global-funds');
    const { t } = useTranslation(['markets', 'common']);

    return (
        <div className="min-h-screen bg-bg text-text">
          <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
            <div className="mb-10">
                <h1 className="text-2xl sm:text-3xl font-black uppercase text-text tracking-tight flex items-center gap-3">
                    <span className="w-2 h-8 bg-primary rounded-full"></span>
                    {t('markets:funds.globalHeaderTitle')}
                </h1>
            </div>

            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-2 text-text-muted text-xs uppercase font-bold">
                    <tr>
                        <th className="p-5">{t('markets:funds.fundType')}</th>
                        <th className="p-5 text-right">{t('common:labels.price')}</th>
                        <th className="p-5 text-right">{t('common:labels.change')}</th>
                        <th className="p-5"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2e39]">
                    {etfs.map((etf, i) => {
                        const symbol = etf.currencyCode || etf.symbol || "";
                        const isPositive = (etf.changePercent || 0) >= 0;

                        return (
                            <tr key={i} onClick={() => navigate(`/chart/${encodeURIComponent(symbol)}?cat=FUND`)} className="hover:bg-surface-2 transition-colors cursor-pointer group">
                                <td className="p-5">
                                    <div className="font-bold text-text group-hover:text-text transition">{etf.currencyName || etf.name}</div>
                                    <div className="text-[10px] text-text-muted font-mono">{symbol}</div>
                                </td>
                                <td className="p-5 text-right font-mono text-text">
                                    ${formatNumber(etf.forexBuying || etf.price || 0)}
                                </td>
                                <td className={`p-5 text-right font-bold ${isPositive ? 'text-buy' : 'text-sell'}`}>
                                    {isPositive ? '+' : ''}{etf.changePercent}%
                                </td>
                                <td className="p-5 text-right text-text-muted group-hover:text-primary transition">
                                    <ChevronRight size={18} />
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
    );
}
