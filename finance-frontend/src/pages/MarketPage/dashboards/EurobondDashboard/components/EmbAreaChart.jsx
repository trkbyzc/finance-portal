import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { RANGE_KEYS } from './eurobondShared';
import { formatChartDate } from '../../../../../utils/formatters/dateFormatter';

const EmbTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    const raw = p.payload.close ?? p.payload.price ?? p.value;
    return (
        <div className="bg-surface-2 border border-border px-3 py-2 rounded text-xs">
            <div className="text-text-muted">{formatChartDate(p.payload.date)}</div>
            <div className="font-mono font-bold text-warning">${Number(raw).toFixed(2)}</div>
        </div>
    );
};

/**
 * EMB ETF area chart + range selector + "Detaylar" linki. Tıklanan area asset detail'a yönlendirir.
 */
export default function EmbAreaChart({ activeRange, setActiveRange, embHistory, embLoading, embAsset, onAssetClick }) {
    const { t } = useTranslation(['common']);
    const lastPrice = embAsset?.price ? Number(embAsset.price) : null;

    return (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                    <div className="text-2xl font-bold font-mono text-warning">
                        {lastPrice != null ? `$${lastPrice.toFixed(2)}` : '—'}
                    </div>
                    <div className="text-xs text-text-muted">{t('common:labels.price')} (USD)</div>
                </div>
                <div className="flex gap-2">
                    {RANGE_KEYS.map(key => (
                        <button
                            key={key}
                            onClick={() => setActiveRange(key)}
                            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                                activeRange === key
                                    ? 'bg-warning text-text'
                                    : 'bg-surface-2 text-text-muted hover:text-text border border-border'
                            }`}
                        >
                            {t(`common:ranges.${key}`)}
                        </button>
                    ))}
                    <button
                        onClick={onAssetClick}
                        disabled={!embAsset}
                        className="px-3 py-1.5 rounded text-xs font-semibold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {t('common:actions.details')} →
                    </button>
                </div>
            </div>

            {embLoading ? (
                <div className="h-[400px] flex items-center justify-center text-text-muted">{t('common:status.loading')}</div>
            ) : embHistory.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center text-text-muted">{t('common:status.noData')}</div>
            ) : (
                <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={embHistory}>
                        <defs>
                            <linearGradient id="embFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ff9800" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#ff9800" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                        <XAxis dataKey="date" stroke="#787b86" tick={{ fontSize: 11 }} minTickGap={40} tickFormatter={formatChartDate} />
                        <YAxis stroke="#787b86" orientation="right" tick={{ fontSize: 11 }} domain={['auto', 'auto']} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                        <Tooltip content={<EmbTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="close"
                            stroke="#ff9800"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#embFill)"
                            onClick={onAssetClick}
                            style={{ cursor: embAsset ? 'pointer' : 'default' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}

            <div className="mt-4 text-xs text-text-muted border-t border-border pt-3">
                <strong className="text-warning">EMB ETF:</strong> iShares J.P. Morgan USD Emerging Markets Bond — Turkey ≈ %8-10.
            </div>
        </div>
    );
}
