import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BellRing, X, Loader2, ArrowUp, ArrowDown, Zap, Repeat, Settings2 } from 'lucide-react';
import { alarmApi } from '../../services/api/alarmApi';
import { historicalApi } from '../../services/api/historicalApi';
import { historicalCategory } from '../../utils/historicalPrice';
import { useNotify } from '../../context/NotificationContext';
import { toBackendAssetType } from '../../utils/assetTypeMapper';

const YIELD_CATS = new Set(['BOND', 'TR_BOND', 'EUROBOND']);

const deriveCurrent = (asset) => {
    const v = asset?.currentPrice ?? asset?.displayPrice ?? asset?.price ??
        asset?.forexSelling ?? asset?.forexBuying ?? asset?.yield ?? null;
    return (v != null && Number(v) !== 0) ? v : null; // 0/null → "geçerli fiyat yok"
};

const fmtPrice = (n) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return '—';
    return v.toLocaleString('tr-TR', { maximumFractionDigits: 4 });
};

// Hızlı hedef ön-ayarları — güncel fiyata göre yüzde sapma
const PRESETS = [-10, -5, 5, 10];

async function fetchLatestPrice(symbol, backendType) {
    const category = historicalCategory(backendType, symbol);
    if (!category) return null;
    const res = await historicalApi.getData({ symbol, category, range: '1y', interval: '1d' });
    const arr = Array.isArray(res) ? res : (res?.priceData || res || []);
    for (let i = arr.length - 1; i >= 0; i--) {
        const c = Number(arr[i]?.close ?? arr[i]?.price ?? arr[i]?.value);
        if (Number.isFinite(c) && c > 0) return c;
    }
    return null;
}

/**
 * Bir varlık için fiyat alarmı kurma modal'ı.
 *
 * Props:
 *   open, onClose
 *   asset: { symbol|currencyCode, name?, assetCategory, currentPrice?/price?/... }
 */
export default function AlarmModal({ open, onClose, asset }) {
    const { t } = useTranslation(['alarm', 'common']);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const notify = useNotify();

    const propPrice = deriveCurrent(asset);
    const symbol = asset?.symbol || asset?.currencyCode;
    const backendType = asset ? toBackendAssetType(asset.assetCategory) : null;
    // Getiri-bazlı varlık (tahvil/bono/eurobond) — "fiyat" yerine "getiri" gösterilir
    const isYield = !!asset?.isYieldBased || YIELD_CATS.has((asset?.assetCategory || '').toUpperCase());

    // Fon gibi anlık fiyatı 0/eksik gelen varlıklarda gerçek son fiyatı historical'dan çek.
    const { data: fetchedPrice } = useQuery({
        queryKey: ['alarm-latest-price', symbol, backendType],
        queryFn: () => fetchLatestPrice(symbol, backendType),
        enabled: !!(open && asset && symbol && propPrice == null),
        staleTime: 60 * 1000
    });

    const currentPrice = propPrice ?? fetchedPrice ?? null;

    const [condition, setCondition] = useState('ABOVE'); // ABOVE | BELOW
    const [frequency, setFrequency] = useState('ONCE'); // ONCE | CONTINUOUS
    const [threshold, setThreshold] = useState(propPrice == null ? '' : String(propPrice));
    const [note, setNote] = useState('');

    // Fiyat sonradan (fetch ile) gelirse ve kullanıcı henüz değer girmediyse hedefi doldur.
    useEffect(() => {
        if (currentPrice != null && threshold === '') setThreshold(String(currentPrice));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPrice]);

    const createMutation = useMutation({
        mutationFn: alarmApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-alarms'] });
            notify({
                type: 'success',
                title: t('alarm:modal.created', 'Alarm oluşturuldu'),
                message: asset?.symbol || asset?.currencyCode || ''
            });
            onClose?.();
        },
        onError: (err) => {
            notify({
                type: 'error',
                title: t('alarm:modal.createFailed', 'Alarm kurulamadı'),
                message: err?.response?.data?.message || ''
            });
        }
    });

    if (!open || !asset) return null;

    const canSubmit = () => {
        const v = Number.parseFloat(threshold);
        // v parseFloat sonucu zaten number; Number.isNaN ile aynı sonuç + S7773 uyumlu.
        return !Number.isNaN(v) && v > 0;
    };

    const applyPreset = (pct) => {
        if (currentPrice == null) return;
        const target = Number(currentPrice) * (1 + pct / 100);
        setThreshold(String(+target.toFixed(4)));
        setCondition(pct >= 0 ? 'ABOVE' : 'BELOW'); // yön otomatik
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!canSubmit()) return;
        createMutation.mutate({
            symbol: asset.symbol || asset.currencyCode,
            assetType: toBackendAssetType(asset.assetCategory),
            condition,
            threshold: Number.parseFloat(threshold),
            frequency,
            note: note.trim() || null
        });
    };

    const displayName = asset.name || asset.currencyName || asset.symbol || asset.currencyCode;
    const isAbove = condition === 'ABOVE';

    return (
        <div
            className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Başlık şeridi — gradient + güncel fiyat rozeti */}
                <div className="relative bg-linear-to-br from-primary/15 via-primary/5 to-transparent px-5 pt-5 pb-4 border-b border-border">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-surface-hover transition-colors"
                    >
                        <X size={18} />
                    </button>
                    <div className="flex items-center gap-3 min-w-0 pr-8">
                        <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                            <BellRing size={20} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-primary">
                                {isYield ? t('alarm:modal.kickerYield', 'Getiri Alarmı') : t('alarm:modal.kicker', 'Fiyat Alarmı')}
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-text truncate leading-tight">{displayName}</h2>
                        </div>
                    </div>
                    {currentPrice != null && (
                        <div className="mt-3 inline-flex items-center gap-2 bg-surface/80 border border-border rounded-lg px-3 py-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{t('alarm:modal.current', 'Şu an')}</span>
                            <span className="font-mono font-bold text-text text-sm">{isYield ? `%${fmtPrice(currentPrice)}` : fmtPrice(currentPrice)}</span>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Koşul — iki büyük seçilebilir kart */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                            {t('alarm:modal.condition', 'Koşul')}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setCondition('ABOVE')}
                                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                                    isAbove ? 'border-buy bg-buy/10 text-buy' : 'border-border text-text-muted hover:border-buy/40'
                                }`}
                            >
                                <ArrowUp size={20} />
                                <span className="text-xs font-bold">{t('alarm:modal.above', 'Üzerine Çıkarsa')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCondition('BELOW')}
                                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                                    isAbove ? 'border-border text-text-muted hover:border-sell/40' : 'border-sell bg-sell/10 text-sell'
                                }`}
                            >
                                <ArrowDown size={20} />
                                <span className="text-xs font-bold">{t('alarm:modal.below', 'Altına İnerse')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Hedef fiyat + hızlı ön-ayarlar */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                            {isYield ? t('alarm:modal.targetYield', 'Hedef Getiri') : t('alarm:modal.targetPrice', 'Hedef Fiyat')}
                        </label>
                        <input
                            type="number"
                            step="0.0001"
                            min="0"
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary text-sm font-mono"
                            required
                        />
                        {currentPrice != null && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {PRESETS.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => applyPreset(p)}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${
                                            p >= 0
                                                ? 'border-buy/30 text-buy hover:bg-buy/10'
                                                : 'border-sell/30 text-sell hover:bg-sell/10'
                                        }`}
                                    >
                                        {p > 0 ? '+' : ''}{p}%
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sıklık */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                            {t('alarm:modal.frequency', 'Sıklık')}
                        </label>
                        <div className="grid grid-cols-2 gap-2 bg-bg border border-border rounded-lg p-1">
                            <button
                                type="button"
                                onClick={() => setFrequency('ONCE')}
                                className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-semibold transition ${
                                    frequency === 'ONCE' ? 'bg-primary text-primary-fg shadow' : 'text-text-muted hover:text-text hover:bg-surface'
                                }`}
                            >
                                <Zap size={14} /> {t('alarm:modal.once', 'Tek Seferlik')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setFrequency('CONTINUOUS')}
                                className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-semibold transition ${
                                    frequency === 'CONTINUOUS' ? 'bg-primary text-primary-fg shadow' : 'text-text-muted hover:text-text hover:bg-surface'
                                }`}
                            >
                                <Repeat size={14} /> {t('alarm:modal.continuous', 'Sürekli')}
                            </button>
                        </div>
                        <p className="text-[11px] text-text-muted mt-1.5">
                            {frequency === 'ONCE'
                                ? t('alarm:modal.onceHint', 'Koşul bir kez sağlandığında tetiklenir ve durur.')
                                : t('alarm:modal.continuousHint', 'Koşul her sağlandığında bildirim atar (30dk cooldown).')}
                        </p>
                    </div>

                    {/* Not */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                            {t('alarm:modal.note', 'Not')}
                            <span className="text-text-muted/60 normal-case ml-1">({t('alarm:modal.optional', 'isteğe bağlı')})</span>
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={t('alarm:modal.notePlaceholder', 'ör. Hedef satış fiyatım — alarm e-postasına eklenir')}
                            rows="2"
                            maxLength={500}
                            className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary text-sm resize-none"
                        />
                    </div>

                    {/* Submit — koşul rengine göre */}
                    <button
                        type="submit"
                        disabled={!canSubmit() || createMutation.isPending}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition ${
                            isAbove ? 'bg-buy hover:opacity-90' : 'bg-sell hover:opacity-90'
                        }`}
                    >
                        {(() => {
                            if (createMutation.isPending) return <Loader2 className="animate-spin" size={16} />;
                            return isAbove ? <ArrowUp size={15} /> : <ArrowDown size={15} />;
                        })()}
                        {t('alarm:modal.create', 'Alarmı Kur')}
                    </button>

                    <button
                        type="button"
                        onClick={() => { onClose?.(); navigate('/alarms'); }}
                        className="w-full flex items-center justify-center gap-1.5 text-xs text-text-muted font-semibold hover:text-primary transition-colors"
                    >
                        <Settings2 size={13} /> {t('alarm:modal.manageAlarms', 'Alarmlarımı Düzenle')}
                    </button>
                </form>
            </div>
        </div>
    );
}
