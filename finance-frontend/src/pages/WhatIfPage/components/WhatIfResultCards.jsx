import React from 'react';
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
                    <div key={a.key} className="bg-surface border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                            <div className="font-bold uppercase">{a.symbol}</div>
                            <span className="text-xs text-text-muted">{t('common:assetTypes.' + a.assetType, a.assetType)}</span>
                        </div>
                        {a.warning ? (
                            <div className="bg-warning/10 border border-warning/30 rounded-lg p-2 text-warning text-xs flex items-start gap-2">
                                <Info size={12} className="mt-0.5 shrink-0" />
                                <span>{a.warning}</span>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-text-muted">{t('whatIf:result.currentValue')}</span>
                                    <span className="font-mono font-bold">{fmtTry(a.currentValue)} ₺</span>
                                </div>
                                <div className={`flex items-center justify-between mt-2 pt-2 border-t border-border ${positive ? 'text-buy' : 'text-sell'}`}>
                                    <span className="text-xs font-semibold inline-flex items-center gap-1">
                                        {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {t('whatIf:result.pnlPct')}
                                    </span>
                                    <span className="font-mono font-bold">
                                        {positive ? '+' : ''}{Number(a.pnlPct ?? 0).toFixed(2)}%
                                    </span>
                                </div>
                                <div className="text-[10px] text-text-muted text-right mt-1">
                                    {positive ? '+' : ''}{fmtTry(a.pnlTry)} ₺
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
