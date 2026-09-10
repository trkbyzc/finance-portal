import { useState, useEffect } from 'react';
import { Loader2, Plus, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../../context/CurrencyContext';
import { nativeCurrencyForType } from '../../../utils/currencyConversion';
import { isYieldCategory, yieldFieldLabelKey } from '../../../utils/assetNature';
import { fetchPriceOnDate } from '../../../utils/historicalPrice';
import { simulationApi } from '../../../services/api/simulationApi';
import DatePicker from '../../common/DatePicker';
import SelectMenu from '../../common/SelectMenu';

/**
 * AddToPortfolioModal step 3 — adet + tutar (çift yönlü) + alış fiyatı + tarih.
 * Tarih seçilince o tarihteki fiyat çekilip alış fiyatı doldurulur. Submit → parent.onSubmit.
 */
export default function Step3EntryForm({ selectedAsset, selectedType, selectedBackendValue, onSubmit, onBack, portfolios = [], activePortfolioId = null }) {
    const { t } = useTranslation(['portfolio', 'common']);
    const { formatNative } = useCurrency();
    const [quantity, setQuantity] = useState('');
    const [amount, setAmount] = useState('');
    const [averagePrice, setAveragePrice] = useState('');
    const [purchaseDate, setPurchaseDate] = useState('');
    const [priceLoading, setPriceLoading] = useState(false);
    const [datePriceInfo, setDatePriceInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    // Bu varlığın en eski historical tarihi — DatePicker min'i + ibare için (simülasyondaki gibi)
    const [earliestDate, setEarliestDate] = useState(null);
    const [earliestLoading, setEarliestLoading] = useState(false);
    // Hedef portföy — varsayılan aktif portföy; birden fazla portföy varsa kullanıcı seçebilir.
    const [targetPortfolioId, setTargetPortfolioId] = useState(activePortfolioId || (portfolios[0]?.id ?? ''));
    // VİOP pozisyon yönü — uzun (long, yükselişe) veya kısa (short, düşüşe). VİOP dışında kullanılmaz.
    const [direction, setDirection] = useState('LONG');

    // VİOP'ta 1 sözleşme = çarpan kadar dayanak; nominal = fiyat × çarpan × adet
    const isViop = selectedType === 'VIOP' || selectedBackendValue === 'FUTURE';
    const contractSize = isViop ? (Number(selectedAsset.contractSize) || 1) : 1;
    // Sabit getiri (tahvil) şablonu: "Adet→Nominal", "Alış Fiyatı→Getiri (%)/Temiz Fiyat (%)", "Tutar" alanı gizli.
    const isBond = isYieldCategory(selectedType) || isYieldCategory(selectedBackendValue);
    const priceLabelKey = yieldFieldLabelKey(selectedType) || yieldFieldLabelKey(selectedBackendValue);
    const priceLabel = priceLabelKey
        ? t(`portfolio:modal.${priceLabelKey}`, priceLabelKey === 'cleanPrice' ? 'Temiz Fiyat (%)' : 'Getiri (%)')
        : t('portfolio:modal.purchasePrice');
    const symbol = selectedAsset.symbol || selectedAsset.currencyCode;
    const backendType = selectedBackendValue || selectedType;
    const todayStr = new Date().toISOString().slice(0, 10);

    useEffect(() => {
        if (!symbol || !backendType) return;
        setEarliestLoading(true);
        setEarliestDate(null);
        simulationApi.getEarliestDate(symbol, backendType)
            .then(res => setEarliestDate(res?.earliestDate || null))
            .catch(err => { console.error('earliestDate fetch failed:', err); setEarliestDate(null); })
            .finally(() => setEarliestLoading(false));
    }, [symbol, backendType]);

    const unitPrice = () => {
        const p = Number.parseFloat(averagePrice);
        if (p > 0) return p;
        return Number(selectedAsset.currentPrice || selectedAsset.price || selectedAsset.forexSelling
            || selectedAsset.value || selectedAsset.lastPrice || selectedAsset.unitPrice || 0) || 0;
    };
    const handleQuantity = (v) => {
        setQuantity(v);
        const p = unitPrice();
        setAmount(v && p > 0 ? String(+(Number.parseFloat(v) * p).toFixed(2)) : '');
    };
    const handleAmount = (v) => {
        setAmount(v);
        const p = unitPrice();
        setQuantity(v && p > 0 ? String(+(Number.parseFloat(v) / p).toFixed(8)) : '');
    };
    const handlePrice = (v) => {
        setAveragePrice(v);
        const p = Number.parseFloat(v);
        if (quantity && p > 0) setAmount(String(+(Number.parseFloat(quantity) * p).toFixed(2)));
    };
    const handleDate = async (v) => {
        setPurchaseDate(v);
        setDatePriceInfo(null);
        if (!v || !symbol) return;
        setPriceLoading(true);
        try {
            const price = await fetchPriceOnDate(symbol, backendType, v);
            if (price != null && price > 0) {
                setAveragePrice(String(price));
                setDatePriceInfo({ ok: true, price });
                if (quantity) setAmount(String(+(Number.parseFloat(quantity) * price).toFixed(2)));
            } else {
                setDatePriceInfo({ ok: false });
            }
        } finally {
            setPriceLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({
                symbol: selectedAsset.symbol || selectedAsset.currencyCode,
                assetType: selectedBackendValue || selectedType,
                quantity: Number.parseFloat(quantity),
                averagePrice: Number.parseFloat(averagePrice),
                // Seçilen hedef portföy (yoksa parent aktif portföye ekler)
                ...(targetPortfolioId ? { portfolioId: targetPortfolioId } : {}),
                // Alış tarihi seçildiyse gönder — reel getiri/enflasyon işlem tarihinden hesaplanır
                ...(purchaseDate ? { purchaseDate } : {}),
                ...(isViop ? { contractSize, direction } : {})
            });
        } catch (error) {
            // Hata bildirimi parent mutation'ın onError'ında toast olarak gösterilir.
            console.error('Add to portfolio error:', error);
        } finally {
            setLoading(false);
        }
    };

    const currentPrice = selectedAsset.currentPrice || selectedAsset.price || selectedAsset.forexSelling
        || selectedAsset.value || selectedAsset.lastPrice || selectedAsset.unitPrice || 0;
    const native = nativeCurrencyForType(selectedType, selectedAsset?.symbol || selectedAsset?.currencyCode);

    // VİOP nominal değeri (girilen adet üzerinden) — kullanıcı gerçek maruziyeti görsün
    const qtyNum = Number.parseFloat(quantity);
    const priceNum = Number.parseFloat(averagePrice) || currentPrice || 0;
    const notional = isViop && qtyNum > 0 ? priceNum * contractSize * qtyNum : null;

    return (
        <form onSubmit={handleSubmit}>
            <h3 className="text-lg font-semibold mb-4">{t('portfolio:modal.editTitle')}</h3>

            <div className="bg-bg border border-border rounded-xl p-4 mb-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                        <div className="font-semibold text-lg truncate">{selectedAsset.symbol || selectedAsset.currencyCode}</div>
                        <div className="text-sm text-text-muted truncate">{selectedAsset.name || selectedAsset.currencyName}</div>
                    </div>
                    <div className="shrink-0 bg-surface border border-border rounded-lg px-3 py-2 text-right">
                        <div className="text-[10px] uppercase tracking-wider text-text-muted">{t('common:labels.price')}</div>
                        <div className="font-semibold text-base mt-0.5">
                            {currentPrice > 0
                                ? (isBond
                                    ? (priceLabelKey === 'cleanPrice' ? Number(currentPrice).toFixed(2) : `%${Number(currentPrice).toFixed(2)}`)
                                    : formatNative(currentPrice, native))
                                : '—'}
                        </div>
                    </div>
                </div>
            </div>

            {portfolios.length > 1 && (
                <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">{t('portfolio:modal.targetPortfolio', 'Hangi portföye?')}</label>
                    <SelectMenu
                        value={targetPortfolioId}
                        onChange={setTargetPortfolioId}
                        options={portfolios.map((p) => ({ value: p.id, label: p.name }))}
                        placeholder={t('portfolio:modal.targetPortfolio', 'Hangi portföye?')}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                <div>
                    <label className="block text-sm font-semibold mb-2">{t('portfolio:modal.purchaseDate', 'Alış Tarihi')}</label>
                    <div className="relative">
                        <DatePicker
                            value={purchaseDate}
                            onChange={handleDate}
                            min={earliestDate || undefined}
                            max={todayStr}
                        />
                        {priceLoading && <Loader2 className="animate-spin absolute right-10 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={18} />}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-2">{priceLabel}</label>
                    <input
                        type="number"
                        step="0.01"
                        value={averagePrice}
                        onChange={(e) => handlePrice(e.target.value)}
                        placeholder="45.50"
                        className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                        required
                    />
                </div>
            </div>
            <div className="min-h-[18px] mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                {datePriceInfo?.ok && (
                    <p className="text-[11px] text-buy">
                        {t('portfolio:modal.datePriceFound', 'O tarihteki fiyat')}: {formatNative(datePriceInfo.price, native)}
                    </p>
                )}
                {datePriceInfo && !datePriceInfo.ok && (
                    <p className="text-[11px] text-text-muted">{t('portfolio:modal.datePriceMissing', 'Bu tarih için fiyat bulunamadı, elle girebilirsiniz.')}</p>
                )}
                {/* En erken tarih ibaresi — simülasyondaki gibi, kullanıcı veri olmayan eski tarihi seçmesin */}
                {earliestLoading && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
                        <Loader2 className="animate-spin" size={11} />
                        {t('portfolio:modal.earliestLoading', 'Tarih aralığı kontrol ediliyor…')}
                    </span>
                )}
                {!earliestLoading && earliestDate && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
                        <Calendar size={11} />
                        {t('portfolio:modal.earliestAvailable', { date: earliestDate, defaultValue: 'Bu varlık için en erken tarih: {{date}}' })}
                    </span>
                )}
            </div>

            {isViop && (
                <div className="mb-5">
                    <label className="block text-sm font-semibold mb-2">{t('portfolio:modal.direction', 'Pozisyon Yönü')}</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setDirection('LONG')}
                            className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${direction === 'LONG' ? 'border-buy bg-buy/10 text-buy' : 'border-border bg-bg text-text-muted hover:border-buy/50'}`}
                        >
                            <span className="flex items-center justify-center gap-1.5"><TrendingUp size={16} /> {t('portfolio:modal.directionLong', 'Uzun (Long)')}</span>
                            <span className="block text-[10px] font-normal mt-0.5 opacity-80">{t('portfolio:modal.directionLongHint', 'Fiyat yükselince kazanırsın')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setDirection('SHORT')}
                            className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${direction === 'SHORT' ? 'border-sell bg-sell/10 text-sell' : 'border-border bg-bg text-text-muted hover:border-sell/50'}`}
                        >
                            <span className="flex items-center justify-center gap-1.5"><TrendingDown size={16} /> {t('portfolio:modal.directionShort', 'Kısa (Short)')}</span>
                            <span className="block text-[10px] font-normal mt-0.5 opacity-80">{t('portfolio:modal.directionShortHint', 'Fiyat düşünce kazanırsın')}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Adet ↔ Tutar (çift yönlü). Tahvilde "Tutar" gizli — nominal × temiz fiyat değeri backend'de hesaplanır. */}
            <div className={`grid grid-cols-1 ${isBond ? '' : 'md:grid-cols-2'} gap-3 mb-6`}>
                <div>
                    <label className="block text-sm font-semibold mb-2">{isBond ? t('portfolio:modal.nominal', 'Nominal') : t('portfolio:modal.quantity')}</label>
                    <input
                        type="number"
                        step="0.00000001"
                        value={quantity}
                        onChange={(e) => handleQuantity(e.target.value)}
                        placeholder="100"
                        className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                        required
                        autoFocus
                    />
                </div>
                {!isBond && (
                    <div>
                        <label className="block text-sm font-semibold mb-2">{t('portfolio:modal.amount', 'Tutar')}</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => handleAmount(e.target.value)}
                            placeholder="4550"
                            className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                        />
                    </div>
                )}
            </div>

            {isViop && (
                <div className="bg-bg border border-border rounded-lg p-4 mb-6 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-text-muted">{t('portfolio:modal.contractSize', 'Sözleşme Büyüklüğü (çarpan)')}</span>
                        <span className="font-semibold">× {contractSize}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-text-muted">{t('portfolio:modal.notional', 'Nominal Değer')}</span>
                        <span className="font-semibold text-primary">
                            {notional == null ? '—' : formatNative(notional, native)}
                        </span>
                    </div>
                    <p className="text-[11px] text-text-muted mt-2">
                        {t('portfolio:modal.notionalHint', 'Nominal = fiyat × çarpan × adet. Portföy değeri ve K/Z bu çarpanla hesaplanır.')}
                    </p>
                </div>
            )}

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 px-4 py-3 bg-surface-hover hover:bg-surface-hover rounded-lg font-semibold transition"
                >
                    ← {t('common:actions.back')}
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-primary hover:bg-primary-hover text-primary-fg rounded-lg font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                    {loading ? t('common:actions.loadingDots') : (<><Plus size={18} /> {t('common:actions.save')}</>)}
                </button>
            </div>
        </form>
    );
}
