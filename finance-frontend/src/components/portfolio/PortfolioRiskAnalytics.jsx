import React from 'react';
import { Activity, TrendingDown, Gauge, ShieldCheck, Loader2, Sigma, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useRiskAnalytics from '../../pages/PortfolioPage/hooks/useRiskAnalytics';

const pct = (v) => `${v >= 0 ? '' : ''}${(v * 100).toFixed(1)}%`;
const signedPct = (v) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;

// Korelasyon hücre rengi — sistem tema token'larıyla (buy/sell/warning), 3 temada da uyumlu.
// Yüksek (+) korelasyon = az çeşitlenme → sell (kırmızı); negatif/düşük = iyi → buy (yeşil).
const corrCellClass = (v) => {
    if (v >= 0.7) return 'bg-sell text-primary-fg';
    if (v >= 0.4) return 'bg-sell/60 text-primary-fg';
    if (v >= 0.1) return 'bg-warning/40 text-text';
    if (v > -0.1) return 'bg-surface-hover text-text-muted';
    return 'bg-buy/70 text-primary-fg';
};
const shortSym = (s) => (s || '').replace('-USD', '').replace('.IS', '').replace('TP.', '');

function RiskCard({ icon: Icon, label, value, tone = 'neutral', positive = true, hint }) {
    const valueColor = tone === 'pnl' ? (positive ? 'text-buy' : 'text-sell') : tone === 'warn' ? 'text-warning' : 'text-text';
    const chip = tone === 'pnl'
        ? (positive ? 'bg-buy/10 text-buy border-buy/20' : 'bg-sell/10 text-sell border-sell/20')
        : tone === 'warn' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-primary/10 text-primary border-primary/20';
    return (
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${chip}`}>
                    <Icon size={18} />
                </div>
                <p className="text-text-muted text-[11px] font-bold uppercase tracking-wider leading-tight">{label}</p>
            </div>
            <p className={`text-2xl font-mono font-black tracking-tight ${valueColor}`}>{value}</p>
            {hint && <p className="text-[11px] text-text-muted mt-1 leading-snug">{hint}</p>}
        </div>
    );
}

/**
 * Portföy Risk & Çeşitlendirme paneli — volatilite, maks. düşüş, beta, Sharpe + konsantrasyon
 * skoru + holdingler arası korelasyon ısı haritası. Tamamen 1y günlük historical veriden hesaplanır.
 */
export default function PortfolioRiskAnalytics({ portfolio, calculateProfitLoss, hidden = false }) {
    const { t } = useTranslation(['portfolio', 'common']);
    const { loading, ready, insufficient, metrics, correlation } = useRiskAnalytics(portfolio, calculateProfitLoss, !hidden);

    if (hidden) return null;

    const Wrapper = ({ children }) => (
        <div className="bg-surface-2 rounded-2xl p-6 border border-border/50 mt-6">
            <div className="flex items-center gap-2 mb-1">
                <Gauge size={20} className="text-primary" />
                <h3 className="text-xl font-bold">{t('risk.title', 'Risk & Çeşitlendirme')}</h3>
            </div>
            <p className="text-xs text-text-muted mb-4">{t('risk.subtitle', 'Son 1 yıllık günlük veriye göre hesaplanır')}</p>
            {children}
        </div>
    );

    if (loading) return <Wrapper><div className="h-40 flex items-center justify-center text-text-muted"><Loader2 className="animate-spin" size={26} /></div></Wrapper>;
    if (!ready) return null;
    if (insufficient || !metrics) {
        return <Wrapper><div className="py-8 text-center text-sm text-text-muted">{t('risk.insufficient', 'Risk metrikleri için yeterli geçmiş veri yok (en az ~1 ay ortak veri gerekir).')}</div></Wrapper>;
    }

    const m = metrics;
    const concentrated = m.topWeight >= 0.6;

    return (
        <Wrapper>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                <RiskCard
                    icon={Activity}
                    label={t('risk.volatility', 'Volatilite (yıllık)')}
                    value={pct(m.annVol)}
                    tone={m.annVol > 0.5 ? 'warn' : 'neutral'}
                    hint={t('risk.volatilityHint', 'Yıllık dalgalanma')}
                />
                <RiskCard
                    icon={TrendingDown}
                    label={t('risk.maxDrawdown', 'Maks. Düşüş')}
                    value={signedPct(m.maxDrawdown)}
                    tone="pnl"
                    positive={false}
                    hint={t('risk.maxDrawdownHint', 'Zirveden en dip kayıp')}
                />
                <RiskCard
                    icon={Gauge}
                    label={t('risk.beta', 'Beta (BIST 100)')}
                    value={m.beta != null ? m.beta.toFixed(2) : '—'}
                    tone="neutral"
                    hint={m.beta != null
                        ? (m.beta > 1 ? t('risk.betaHigh', 'Piyasadan oynak') : t('risk.betaLow', 'Piyasadan sakin'))
                        : t('risk.betaNA', 'Hesaplanamadı')}
                />
                <RiskCard
                    icon={Sigma}
                    label={t('risk.sharpe', 'Sharpe (rf=0)')}
                    value={m.sharpe.toFixed(2)}
                    tone="pnl"
                    positive={m.sharpe >= 0}
                    hint={t('risk.sharpeHint', 'Risk başına getiri')}
                />
            </div>

            {/* Konsantrasyon / çeşitlendirme */}
            <div className={`flex items-start gap-3 rounded-xl p-4 border mb-5 ${concentrated ? 'bg-warning/10 border-warning/30' : 'bg-buy/5 border-buy/20'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${concentrated ? 'bg-warning/15 text-warning' : 'bg-buy/15 text-buy'}`}>
                    {concentrated ? <Layers size={18} /> : <ShieldCheck size={18} />}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-text">
                        {t('risk.diversification', 'Çeşitlendirme')}: {m.effectiveAssets.toFixed(1)} {t('risk.effectiveAssets', 'etkin varlık')}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                        {t('risk.topConcentration', 'En büyük pozisyon')}: {shortSym(m.topSymbol)} · %{(m.topWeight * 100).toFixed(0)}
                        {concentrated && ` — ${t('risk.concentratedWarn', 'yüksek konsantrasyon, riski tek varlığa bağlı')}`}
                    </p>
                </div>
            </div>

            {/* Korelasyon ısı haritası — 2+ varlıkta anlamlı */}
            {correlation && correlation.symbols.length >= 2 && (
                <div>
                    <p className="text-sm font-bold text-text mb-2">{t('risk.correlation', 'Korelasyon Isı Haritası')}</p>
                    <p className="text-[11px] text-text-muted mb-3">{t('risk.correlationHint', 'Yeşil = düşük/negatif (iyi çeşitlenme) · Kırmızı = yüksek (birlikte hareket)')}</p>
                    <div className="overflow-x-auto">
                        <table className="border-separate" style={{ borderSpacing: 3 }}>
                            <thead>
                                <tr>
                                    <th className="w-14"></th>
                                    {correlation.symbols.map(s => (
                                        <th key={s} className="text-[10px] font-bold text-text-muted px-1 pb-1 text-center">{shortSym(s)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {correlation.symbols.map((rowSym, i) => (
                                    <tr key={rowSym}>
                                        <td className="text-[10px] font-bold text-text-muted pr-2 text-right whitespace-nowrap">{shortSym(rowSym)}</td>
                                        {correlation.matrix[i].map((v, j) => (
                                            <td
                                                key={j}
                                                title={`${shortSym(rowSym)} / ${shortSym(correlation.symbols[j])}: ${v.toFixed(2)}`}
                                                className={`text-[10px] font-bold text-center rounded-md tabular-nums ${corrCellClass(v)}`}
                                                style={{ minWidth: 40, height: 30 }}
                                            >
                                                {v.toFixed(2)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Wrapper>
    );
}
