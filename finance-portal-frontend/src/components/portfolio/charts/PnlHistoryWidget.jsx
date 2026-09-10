import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../../context/CurrencyContext';
import { formatCurrency } from '../../../utils/formatters/currencyFormatter';
import { tooltipStyle, fmtTry } from './portfolioChartColors';
import { displaySymbol } from '../../../utils/symbolDisplay';
import { historicalApi } from '../../../services/api';
import { historicalCategory } from '../../../utils/historicalPrice';
import { nativeCurrencyForType } from '../../../utils/currencyConversion';

const RANGES = ['1mo', '3mo', '6mo', '1y'];
const RANGE_LABELS = { '1mo': '1A', '3mo': '3A', '6mo': '6A', '1y': '1Y' };

/**
 * "K/Z Grafikleri" widget'ı — solda tüm varlıklar (anlık K/Z%), birine tıklayınca sağda o varlığın
 * ZAMAN İÇİNDEKİ kâr/zarar grafiği. K/Z(t) = (fiyat(t) − ort.maliyet) × adet × çarpan × yön × kur.
 * Formül tabloyla (usePortfolioPricing) aynı → grafiğin son noktası anlık K/Z ile örtüşür.
 * VİOP dahil tüm tipler: çarpan (contractSize) ve yön (direction, short=-1) uygulanır.
 */
export default function PnlHistoryWidget({ portfolio, calculateProfitLoss }) {
    const { t } = useTranslation('portfolio');
    const { currency, convertPrice, usdRate } = useCurrency();
    // Getiri-bazlı (tahvil) varlıklar hariç — onlar için zaman-içi "fiyat K/Z" grafiği anlamsız/yanıltıcı
    // (değerleme getiri→temiz fiyat dönüşümüyle backend'de yapılır; spot serisi saçma sonuç verir).
    const list = (portfolio || []).filter((it) => it.assetType !== 'BOND');
    const [selectedSymbol, setSelectedSymbol] = useState(list[0]?.symbol ?? null);
    const [range, setRange] = useState('3mo');

    const item = useMemo(
        () => list.find(i => i.symbol === selectedSymbol) || list[0] || null,
        [list, selectedSymbol]
    );

    const { data: history = [], isLoading } = useQuery({
        queryKey: ['pnlHistory', item?.symbol, item?.assetType, range],
        queryFn: async () => {
            const category = historicalCategory(item.assetType, item.symbol);
            const res = await historicalApi.getData({ symbol: item.symbol, category, range, interval: '1d' });
            return Array.isArray(res) ? res : [];
        },
        enabled: !!item,
        staleTime: 60_000
    });

    const series = useMemo(() => {
        if (!item) return [];
        const qty = Number(item.quantity) || 0;
        const avg = Number(item.averagePrice) || 0;
        const mult = Number(item.contractSize) || 1;
        const dirSign = String(item.direction || '').toUpperCase() === 'SHORT' ? -1 : 1;
        const native = nativeCurrencyForType(item.assetType, item.symbol);
        const rate = native === 'USD' ? (Number(usdRate) || 1) : 1;
        return history
            .map(p => {
                const price = Number(p.close ?? p.price);
                // VİOP gibi `date` boş dönen serilerde `timestamp`'i kullan (yoksa date'ten türet).
                let ts = p.timestamp;
                if (ts == null && p.date) ts = new Date(p.date).getTime();
                if (!Number.isFinite(price) || ts == null) return null;
                const ms = Number(ts) < 1e12 ? Number(ts) * 1000 : Number(ts);
                const pnlTry = (price - avg) * qty * mult * dirSign * rate;
                return { t: ms, pnl: Number(convertPrice(pnlTry, 'TRY')) };
            })
            .filter(Boolean)
            .sort((a, b) => a.t - b.t);
    }, [history, item, usdRate, convertPrice]);

    const lastPnl = series.length ? series[series.length - 1].pnl : 0;
    const up = lastPnl >= 0;
    const color = up ? '#22c55e' : '#ef4444';

    const fmtDate = (ms) => {
        const d = new Date(ms);
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    if (list.length === 0) return null;

    return (
        <div className="bg-surface-2 rounded-2xl p-6 border border-border/50 mt-6">
            <h3 className="text-xl font-bold mb-1">{t('charts.pnlHistory', 'K/Z Grafikleri')}</h3>
            <p className="text-xs text-text-muted mb-4">{t('charts.pnlHistorySub', 'Varlık seç → zaman içindeki kâr/zarar')}</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1 space-y-1 max-h-[340px] overflow-y-auto pr-1">
                    {list.map(it => {
                        const pct = Number(calculateProfitLoss(it).profitLossPercent || 0);
                        const sel = it.symbol === item?.symbol;
                        const pos = pct >= 0;
                        return (
                            <button
                                key={it.symbol}
                                onClick={() => setSelectedSymbol(it.symbol)}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition border ${sel ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-bg'}`}
                            >
                                <span className="font-semibold truncate text-text">{displaySymbol(it.symbol)}</span>
                                <span className={`text-xs font-semibold shrink-0 ${pos ? 'text-buy' : 'text-sell'}`}>
                                    {pos ? '+' : ''}{pct.toFixed(2)}%
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="lg:col-span-2 min-h-[340px]">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-text">{item ? displaySymbol(item.symbol) : ''}</span>
                            {item && series.length > 0 && (
                                <span className={`text-xs font-semibold inline-flex items-center gap-1 ${up ? 'text-buy' : 'text-sell'}`}>
                                    {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                                    {formatCurrency(lastPnl, currency, 2, 2)}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-1">
                            {RANGES.map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRange(r)}
                                    className={`text-[11px] px-2 py-1 rounded-md font-semibold transition ${range === r ? 'bg-primary text-primary-fg' : 'bg-bg text-text-muted hover:text-text'}`}
                                >
                                    {RANGE_LABELS[r]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="h-[300px] flex items-center justify-center text-text-muted">
                            <Loader2 className="animate-spin" size={22} />
                        </div>
                    ) : series.length > 1 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="pnl-hist-fill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                                <XAxis dataKey="t" tickFormatter={fmtDate} stroke="var(--color-text-muted)" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={{ stroke: 'var(--color-border)' }} minTickGap={30} />
                                <YAxis tickFormatter={(v) => fmtTry(v)} width={70} stroke="var(--color-text-muted)" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={{ stroke: 'var(--color-border)' }} />
                                <Tooltip
                                    formatter={(value) => [formatCurrency(value, currency, 2, 2), t('stats.totalPnl')]}
                                    labelFormatter={(ms) => new Date(ms).toLocaleDateString('tr-TR')}
                                    contentStyle={tooltipStyle}
                                    cursor={{ stroke: 'var(--color-text-muted)', strokeOpacity: 0.3 }}
                                />
                                <ReferenceLine y={0} stroke="var(--color-text-muted)" strokeOpacity={0.5} />
                                <Area type="monotone" dataKey="pnl" stroke={color} strokeWidth={2} fill="url(#pnl-hist-fill)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-text-muted text-sm text-center px-4">
                            {t('charts.pnlHistoryEmpty', 'Bu varlık/aralık için yeterli geçmiş veri yok.')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
