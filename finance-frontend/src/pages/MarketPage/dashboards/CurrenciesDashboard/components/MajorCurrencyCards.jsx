import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getFlagUrl } from '../../../../../utils/currencyUtils.js';

export default function MajorCurrencyCards({ currencies, loading, show }) {
    const navigate = useNavigate();
    const { t } = useTranslation('common');
    if (loading || !show) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {currencies.map(major => {
                const selling = major.forexSelling || major.price || 0;
                const change = major.changePercent || major.regularMarketChangePercent || 0;
                const isPositive = change > 0;
                return (
                    <div key={major.currencyCode} onClick={() => navigate(`/chart/${encodeURIComponent(major.currencyCode)}?cat=CURRENCY`)} className="bg-surface border border-border rounded-2xl p-6 hover:border-buy transition-all cursor-pointer group relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-border group-hover:border-buy transition shadow-lg shrink-0">
                                    <img src={getFlagUrl(major.currencyCode)} alt="flag" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-text group-hover:text-buy transition">{major.currencyCode}/TRY</h3>
                                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">{major.currencyName}</p>
                                </div>
                            </div>
                            <div className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${isPositive ? 'bg-buy/10 text-buy' : 'bg-sell/10 text-sell'}`}>
                                {isPositive ? '+' : ''}{change.toFixed(2)}%
                            </div>
                        </div>
                        <div className="flex items-center justify-between relative z-10 bg-surface-2 rounded-xl p-4 border border-border">
                            <div className="flex flex-col">
                                <span className="text-text-muted text-[10px] font-bold uppercase mb-1">{t('labels.buyRate')}</span>
                                <span className="text-lg font-mono font-bold text-text">₺{(major.forexBuying || major.price || 0).toFixed(4)}</span>
                            </div>
                            <ArrowRightLeft size={16} className="text-border" />
                            <div className="flex flex-col items-end">
                                <span className="text-text-muted text-[10px] font-bold uppercase mb-1">{t('labels.sellRate')}</span>
                                <span className="text-lg font-mono font-bold text-buy">₺{selling.toFixed(4)}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
