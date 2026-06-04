import { useTranslation } from 'react-i18next';

/**
 * Grafik başlığının altında, seçili varlığın son mumunun OHLC + Hacim özeti.
 * Sadece klinecharts (candle) modunda gösterilir. Fiyatlar formatPriceLabel ile,
 * hacim locale-aware compact (2,1 Mn / 2.1M) formatlanır. Etiketler i18n (charts:ohlcv).
 */
export default function ChartOhlcvBar({ candle, formatPriceLabel }) {
    const { t, i18n } = useTranslation('charts');
    if (!candle) return null;

    const { open, high, low, close, volume } = candle;
    const change = (close != null && open != null) ? close - open : 0;
    const changePct = open ? (change / open) * 100 : 0;
    const up = change >= 0;

    const locale = i18n.language?.startsWith('en') ? 'en-US' : 'tr-TR';
    const fmtVol = (v) => {
        if (v == null) return '—';            // hacim verisi yok (örn. endeks)
        if (v === 0) return '0';
        return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(v);
    };

    const cards = [
        { label: t('ohlcv.open'), value: formatPriceLabel(open), tone: 'text-text' },
        { label: t('ohlcv.high'), value: formatPriceLabel(high), tone: 'text-buy' },
        { label: t('ohlcv.low'), value: formatPriceLabel(low), tone: 'text-sell' },
        { label: t('ohlcv.close'), value: formatPriceLabel(close), tone: up ? 'text-buy' : 'text-sell' },
        {
            label: t('ohlcv.change'),
            value: `${up ? '+' : ''}${changePct.toFixed(2)}%`,
            tone: up ? 'text-buy' : 'text-sell'
        },
        // Hacim kartı yalnızca veri varsa (endeks gibi hacimsiz varlıklarda gösterilmez)
        ...(volume != null ? [{ label: t('ohlcv.volume'), value: fmtVol(volume), tone: 'text-text' }] : [])
    ];

    return (
        <div className="px-3 py-2.5 bg-surface border-b border-border flex flex-wrap gap-2 shrink-0">
            {cards.map((c) => (
                <div
                    key={c.label}
                    className="flex-1 min-w-20 bg-surface-2 border border-border rounded-lg px-3 py-2"
                >
                    <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted">{c.label}</div>
                    <div className={`text-sm font-mono font-bold ${c.tone}`}>{c.value}</div>
                </div>
            ))}
        </div>
    );
}
