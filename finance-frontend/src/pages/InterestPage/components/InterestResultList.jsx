import { Building, ShieldCheck, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../../utils/formatters/numberFormatter';

export default function InterestResultList({ results, loading }) {
    const { t } = useTranslation(['interest', 'common']);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <p className="text-text-muted animate-pulse">{t('interest:results.loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {results.length > 0 && (
                <div className="bg-linear-to-br from-buy/20 to-surface border border-buy/50 rounded-2xl p-1 relative overflow-hidden mb-8 shadow-lg">
                    <div className="absolute top-0 right-0 bg-buy text-text text-[10px] font-black px-4 py-1 rounded-bl-xl tracking-wider uppercase">
                        {t('interest:results.bestRate')}
                    </div>
                    <div className="bg-surface rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-surface-2 border border-border rounded-2xl flex items-center justify-center shrink-0">
                                <Building className="text-buy" size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-text">{results[0].bankName}</h2>
                                <p className="text-text-muted text-sm">{t('interest:results.cols.rate')}: <strong className="text-text">%{results[0].annualRate.toFixed(2)}</strong></p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center md:items-end w-full md:w-auto">
                            <span className="text-sm text-text-muted font-semibold mb-1">{t('interest:results.cols.interest')}</span>
                            <div className="text-4xl font-black text-buy">+₺{formatNumber(results[0].netYield)}</div>
                            <div className="mt-2 text-xs font-medium text-text-muted flex items-center gap-1">
                                <ShieldCheck size={14} className="text-buy"/> {t('interest:results.cols.totalReturn')}: ₺{formatNumber(results[0].totalPayment)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <h3 className="text-xl font-bold mb-4 text-text">{t('interest:results.title')}</h3>
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-surface-2 border-b border-border text-text-muted text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold">{t('interest:results.cols.bank')}</th>
                            <th className="p-4 font-semibold text-center">{t('interest:results.cols.rate')}</th>
                            <th className="p-4 font-semibold text-right">{t('interest:results.cols.interest')}</th>
                            <th className="p-4 font-semibold text-right">{t('interest:results.cols.totalReturn')}</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2e39]">
                        {results.slice(1).map((item, idx) => (
                            <tr key={idx} className="hover:bg-surface-2 transition-colors group">
                                <td className="p-4 font-bold text-text flex items-center gap-3">
                                    <Building size={16} className="text-text-muted group-hover:text-primary" />
                                    {item.bankName}
                                </td>
                                <td className="p-4 text-center text-sm font-mono font-bold text-text">%{item.annualRate.toFixed(2)}</td>
                                <td className="p-4 text-right font-mono font-bold text-buy">+₺{formatNumber(item.netYield)}</td>
                                <td className="p-4 text-right font-mono font-medium text-text">₺{formatNumber(item.totalPayment)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
