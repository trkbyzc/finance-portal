import { Trash2, TrendingUp, TrendingDown, Info } from 'lucide-react';

const fmtTry = (v) => Number(v ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('tr-TR'); } catch { return iso; }
};

/**
 * Kayıtlı simülasyon kartı — SimulationPage liste view'inde her item için render edilir.
 * Tüm i18n + handler'lar prop ile geçiriliyor; component stateless.
 */
export default function SimulationCard({ sim, onDetail, onDelete, t }) {
    const r = sim.result || {};
    const hasResult = !r.warning && r.series && r.series.length > 0;
    const pnlPct = Number(r.pnlPct ?? 0);
    const pnlTry = Number(r.pnlTry ?? 0);
    const positive = pnlTry >= 0;

    return (
        <div className="bg-surface border border-border rounded-2xl p-5 hover:border-border-strong transition">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="font-bold text-lg uppercase">{sim.symbol}</div>
                    <div className="text-xs text-text-muted">{t('common:assetTypes.' + sim.assetType, sim.assetType)}</div>
                </div>
                <button
                    onClick={onDelete}
                    className="text-text-muted hover:text-sell p-1 rounded transition"
                    title={t('simulation:actions.delete')}
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="text-xs text-text-muted mb-3">
                {t('simulation:card.investedOn', { date: fmtDate(sim.investmentDate) })} · {fmtTry(sim.amountTry)} ₺
            </div>

            {hasResult ? (
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="text-xs text-text-muted">{t('simulation:result.currentValue')}</div>
                        <div className="font-mono font-bold text-lg">{fmtTry(r.currentValue)} ₺</div>
                    </div>
                    <div className={`text-right inline-flex items-center gap-1 font-mono font-bold ${positive ? 'text-buy' : 'text-sell'}`}>
                        {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <div>
                            <div className="text-sm">{positive ? '+' : ''}{pnlPct.toFixed(2)}%</div>
                            <div className="text-[10px] opacity-80">{positive ? '+' : ''}{fmtTry(pnlTry)} ₺</div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-3 flex items-start gap-2 text-warning text-xs">
                    <Info size={14} className="mt-0.5 shrink-0" />
                    <span>{r.warning || t('simulation:result.noResult')}</span>
                </div>
            )}

            {sim.notes && (
                <p className="text-xs text-text-muted italic line-clamp-2 mb-3">{sim.notes}</p>
            )}

            <button
                onClick={onDetail}
                disabled={!hasResult}
                className="w-full px-3 py-2 bg-bg hover:bg-surface-hover border border-border rounded-lg font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {t('simulation:actions.viewChart')}
            </button>
        </div>
    );
}
