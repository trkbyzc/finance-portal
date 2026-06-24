import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PALETTE, fmtTry } from '../whatIfHelpers';

/**
 * Her asset için tek bir özet kart — bugünkü değer + getiri yüzdesi + tutar.
 * Backend'den warning gelirse onu gösterir (örn. yetersiz historical data).
 */
export default function WhatIfResultCards({ result }) {
    const { t } = useTranslation(['whatIf', 'common']);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {result.assets.map((a, idx) => {
                const positive = Number(a.pnlTry ?? 0) >= 0;
                const color = PALETTE[idx % PALETTE.length];
                return (
                    <div
                        key={a.key}
                        className="group relative overflow-hidden bg-surface border border-border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                    >
                        <span className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />

                        <div className="flex items-center gap-2 mb-4">
                            <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ background: color, boxShadow: `0 0 0 3px ${color}22` }}
                            />
                            <span className="font-bold uppercase tracking-wide">{a.symbol}</span>
                            <span className="ml-auto text-[10px] uppercase tracking-wider text-text-muted border border-border rounded-full px-2 py-0.5">
                                {t('common:assetTypes.' + a.assetType, a.assetType)}
                            </span>
                        </div>

                        {a.warning ? (
                            <div className="bg-warning/10 border border-warning/30 rounded-lg p-2 text-warning text-xs flex items-start gap-2">
                                <Info size={12} className="mt-0.5 shrink-0" />
                                <span>{a.warning}</span>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <div className="text-[11px] text-text-muted mb-1">{t('whatIf:result.currentValue')}</div>
                                    <div className="font-mono text-2xl font-bold leading-none">
                                        {fmtTry(a.currentValue)} <span className="text-base font-semibold text-text-muted">₺</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[11px] text-text-muted mb-1">{t('whatIf:result.pnlPct')}</div>
                                    <div className="flex items-end justify-between gap-2">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${positive ? 'bg-buy/10 text-buy' : 'bg-sell/10 text-sell'}`}>
                                            {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            {positive ? '+' : ''}{Number(a.pnlPct ?? 0).toFixed(2)}%
                                        </span>
                                        <span className={`font-mono text-xs font-semibold ${positive ? 'text-buy' : 'text-sell'}`}>
                                            {positive ? '+' : ''}{fmtTry(a.pnlTry)} ₺
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
