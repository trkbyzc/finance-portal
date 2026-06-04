import { ArrowRightLeft, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function BankRateCard({ rate }) {
    const { t } = useTranslation(['common', 'markets']);
    const bankNameOnly = rate.bankName || rate.currencyName || "—";

    const buy = rate.forexBuying || 0;
    const sell = rate.forexSelling || 0;
    const spreadVal = sell - buy;
    const spread = spreadVal.toFixed(4);
    // Makasın fiyata oranı — alış/satış ortalamasına (mid) göre %
    const mid = (buy + sell) / 2;
    const spreadPct = mid > 0 ? (spreadVal / mid) * 100 : 0;

    return (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl hover:border-primary transition-all group hover:-translate-y-1">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-primary border border-border group-hover:border-primary/50 transition-colors">
                        <Building2 size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-text">{bankNameOnly}</h3>
                        <span className="text-xs text-text-muted">{rate.currencyCode}</span>
                    </div>
                </div>
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1.5 rounded-full border border-primary/20 flex items-center gap-1.5 tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    {t('common:status.live')}
                </span>
            </div>

            <div className="flex justify-between items-center px-2">
                <div className="flex flex-col">
                    <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">{t('common:labels.buyRate')}</span>
                    <span className="text-2xl font-mono font-bold text-sell">
                        ₺{buy.toFixed(4)}
                    </span>
                </div>

                <ArrowRightLeft className="text-border group-hover:text-primary transition-colors" size={20} />

                <div className="flex flex-col text-right">
                    <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">{t('common:labels.sellRate')}</span>
                    <span className="text-2xl font-mono font-bold text-buy">
                        ₺{sell.toFixed(4)}
                    </span>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center bg-surface-2/30 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl">
                <span className="text-text-muted text-xs font-bold uppercase tracking-wider">{t('common:labels.spread')}</span>
                <span className="font-mono text-sm font-bold text-warning bg-warning/10 px-2 py-1 rounded border border-warning/20 flex items-center gap-1.5">
                    <span>{spread} ₺</span>
                    <span className="text-warning/60">·</span>
                    <span>%{spreadPct.toFixed(2)}</span>
                </span>
            </div>
        </div>
    );
}
