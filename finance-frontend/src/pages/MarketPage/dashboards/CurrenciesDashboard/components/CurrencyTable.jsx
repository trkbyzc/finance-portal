import { useNavigate } from 'react-router-dom';
import { ChevronRight, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getFlagUrl } from '../../../../../utils/currencyUtils.js';

export default function CurrencyTable({ data, loading }) {
    const navigate = useNavigate();
    const { t } = useTranslation(['markets', 'common']);
    if (loading) return <div className="h-96 animate-pulse bg-surface border border-border rounded-2xl"></div>;

    return (
        <div className="bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-border bg-surface-2/50">
                <h2 className="text-lg font-bold text-text flex items-center gap-2">
                    <DollarSign className="text-buy" size={20} /> {t('currencies.headerTitle')}
                </h2>
            </div>
            <div className="overflow-x-auto max-h-[700px] custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-2 sticky top-0 z-10 shadow-md">
                    <tr>
                        <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider">{t('common:labels.currency')}</th>
                        <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('common:labels.buyRate')}</th>
                        <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('common:labels.sellRate')}</th>
                        <th className="p-5"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2e39]">
                    {data.map((currency) => {
                        const code = currency.currencyCode || currency.symbol;
                        return (
                            <tr key={code} onClick={() => navigate(`/chart/${encodeURIComponent(code)}?cat=CURRENCY`)} className="hover:bg-surface-2 transition cursor-pointer group">
                                <td className="p-5 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-border shrink-0">
                                        <img src={getFlagUrl(code)} alt="flag" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-text group-hover:text-text transition tracking-tight">{code}</div>
                                        <div className="text-[10px] text-text-muted uppercase truncate max-w-[200px]">{currency.currencyName}</div>
                                    </div>
                                </td>
                                <td className="p-5 text-right font-mono font-medium text-text-muted">₺{(currency.forexBuying || currency.price || 0).toFixed(4)}</td>
                                <td className="p-5 text-right font-mono font-medium text-text group-hover:text-buy">₺{(currency.forexSelling || currency.price || 0).toFixed(4)}</td>
                                <td className="p-5 text-right"><ChevronRight size={18} className="text-text-muted group-hover:text-buy" /></td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
