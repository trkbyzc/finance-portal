import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { formatChartDate } from '../../../../../utils/formatters/dateFormatter';

const RANGE_KEYS = ['1m', '3m', '6m', '1y', '5y', 'all'];
const ACCENT = '#ff9800';

const symbolFor = (currency) => (currency === 'EUR' ? '€' : '$');

function EurobondTooltip({ active, payload, currencySymbol }) {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    const raw = p.payload.close ?? p.payload.price ?? p.value;
    return (
        <div className="bg-surface-2 border border-border px-3 py-2 rounded text-xs">
            <div className="text-text-muted">{formatChartDate(p.payload.date)}</div>
            <div className="font-mono font-bold text-warning">{currencySymbol}{Number(raw).toFixed(2)}</div>
        </div>
    );
}

/**
 * Seçili eurobondun temiz fiyat area grafiği (tahvil-bono stilinde turuncu) + aralık seçici.
 * Veri /market-data/historical?category=EUROBOND üzerinden gelir (EurobondChartStrategy → businessinsider).
 */
export default function EurobondAreaChart({ bond, history, loading, activeRange, setActiveRange }) {
    const { t } = useTranslation(['common']);
    const currencySymbol = symbolFor(bond?.currency);
    const lastPrice = bond?.price != null ? Number(bond.price) : null;

    if (!bond) {
        return (
            <div className="w-full h-full bg-surface rounded-2xl border border-border flex items-center justify-center text-text-muted">
                {t('common:actions.select')}
            </div>
        );
    }

    return (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl h-full flex flex-col">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                <div>
                    <div className="text-lg font-bold text-text">{bond.name}</div>
                    <div className="text-2xl font-bold font-mono text-warning mt-1">
                        {lastPrice != null ? `${currencySymbol}${lastPrice.toFixed(2)}` : '—'}
                    </div>
                    <div className="text-xs text-text-muted">{bond.isin}</div>
                </div>
                <div className="flex gap-2 flex-wrap">
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
                </div>
            </div>

            {loading ? (
                <div className="flex-1 min-h-90 flex items-center justify-center text-text-muted">{t('common:status.loading')}</div>
            ) : !history?.length ? (
                <div className="flex-1 min-h-90 flex items-center justify-center text-text-muted">{t('common:status.noData')}</div>
            ) : (
                <ResponsiveContainer width="100%" height="100%" minHeight={360}>
                    <AreaChart data={history}>
                        <defs>
                            <linearGradient id="eurobondFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={ACCENT} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                        <XAxis dataKey="date" stroke="#787b86" tick={{ fontSize: 11 }} minTickGap={40} tickFormatter={formatChartDate} />
                        <YAxis stroke="#787b86" orientation="right" tick={{ fontSize: 11 }} domain={['auto', 'auto']} tickFormatter={(v) => `${currencySymbol}${v.toFixed(0)}`} />
                        <Tooltip content={<EurobondTooltip currencySymbol={currencySymbol} />} />
                        <Area type="monotone" dataKey="close" stroke={ACCENT} strokeWidth={2.5} fillOpacity={1} fill="url(#eurobondFill)" />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
