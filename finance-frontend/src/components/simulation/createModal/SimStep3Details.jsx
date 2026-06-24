import { useEffect, useState } from 'react';
import { ChevronLeft, Loader2, Calendar, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { simulationApi } from '../../../services/api/simulationApi';
import { fetchPriceOnDate } from '../../../utils/historicalPrice';
import { useNotify } from '../../../context/NotificationContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { nativeCurrencyForType } from '../../../utils/currencyConversion';
import DatePicker from '../../common/DatePicker';

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * CreateSimulationModal'ın 3. adımı — tarih + tutar + notlar + preview sonucu.
 *
 * Asset seçildiğinde bu varlığın en erken historical date'ini fetch eder ve <input min>
 * olarak set eder; böylece kullanıcı veri olmayan eski tarihleri seçemez.
 */
export default function SimStep3Details({ selectedAsset, backendType, onPreview, onSave, onBack }) {
    const { t } = useTranslation(['simulation', 'common']);
    const notify = useNotify();
    const { formatNative } = useCurrency();
    // Varlığın kendi para birimi (BTC → $, BIST → ₺) — "o tarihteki fiyat" etiketinde gösterilir
    const nativeCurrency = nativeCurrencyForType(backendType, selectedAsset?.symbol || selectedAsset?.currencyCode);
    const [investmentDate, setInvestmentDate] = useState('');
    const [amountTry, setAmountTry] = useState('');
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');
    const [previewResult, setPreviewResult] = useState(null);
    const [previewing, setPreviewing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [earliestDate, setEarliestDate] = useState(null);
    const [earliestLoading, setEarliestLoading] = useState(false);
    const [datePrice, setDatePrice] = useState(null);
    const [datePriceLoading, setDatePriceLoading] = useState(false);

    // Geçerli birim fiyat (tutar ↔ miktar dönüşümü için). Tarih seçilmeden bilinmez.
    const priceNum = (typeof datePrice === 'number' && datePrice > 0) ? datePrice : 0;

    const handleAmount = (v) => {
        setAmountTry(v);
        setPreviewResult(null);
        setQuantity(priceNum > 0 && v !== '' ? String(+(Number.parseFloat(v) / priceNum).toFixed(8)) : '');
    };
    const handleQuantity = (v) => {
        setQuantity(v);
        setPreviewResult(null);
        setAmountTry(priceNum > 0 && v !== '' ? String(+(Number.parseFloat(v) * priceNum).toFixed(2)) : '');
    };

    const handleDateChange = async (v) => {
        setInvestmentDate(v);
        setPreviewResult(null);
        setDatePrice(null);
        const sym = selectedAsset?.symbol || selectedAsset?.currencyCode;
        if (!v || !sym) return;
        setDatePriceLoading(true);
        try {
            const p = await fetchPriceOnDate(sym, backendType, v);
            const valid = p != null && p > 0;
            setDatePrice(valid ? p : false);
            // Fiyat gelince mevcut alanlardan diğerini güncelle (önce tutar, yoksa miktar baz alınır).
            if (valid) {
                if (amountTry !== '') setQuantity(String(+(Number.parseFloat(amountTry) / p).toFixed(8)));
                else if (quantity !== '') setAmountTry(String(+(Number.parseFloat(quantity) * p).toFixed(2)));
            }
        } finally {
            setDatePriceLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedAsset || !backendType) return;
        const sym = selectedAsset.symbol || selectedAsset.currencyCode;
        if (!sym) return;
        setEarliestLoading(true);
        setEarliestDate(null);
        simulationApi.getEarliestDate(sym, backendType)
            .then(res => setEarliestDate(res?.earliestDate || null))
            .catch(err => { console.error('earliestDate fetch failed:', err); setEarliestDate(null); })
            .finally(() => setEarliestLoading(false));
    }, [selectedAsset, backendType]);

    const buildBody = () => ({
        symbol: selectedAsset.symbol || selectedAsset.currencyCode,
        assetType: backendType,
        investmentDate,
        amountTry: Number.parseFloat(amountTry),
        notes: notes?.trim() || null
    });

    const canSubmit = () => {
        if (!selectedAsset || !investmentDate) return false;
        const amt = Number.parseFloat(amountTry);
        return !Number.isNaN(amt) && amt > 0;
    };

    const handlePreview = async () => {
        if (!canSubmit()) return;
        setPreviewing(true);
        try {
            const result = await onPreview(buildBody());
            setPreviewResult(result);
        } catch (e) {
            console.error(e);
            notify({ type: 'error', title: t('simulation:toast.previewError') });
        } finally {
            setPreviewing(false);
        }
    };

    const handleSave = async () => {
        if (!canSubmit()) return;
        setSaving(true);
        try {
            await onSave(buildBody());
            notify({
                type: 'success',
                title: t('simulation:toast.saved', 'Simülasyon kaydedildi'),
                message: selectedAsset.symbol || selectedAsset.currencyCode || ''
            });
        } catch (e) {
            console.error(e);
            notify({ type: 'error', title: t('simulation:toast.error'), message: e.response?.data?.message || '' });
        } finally {
            setSaving(false);
        }
    };

    const datePriceFmt = (typeof datePrice === 'number')
        ? formatNative(datePrice, nativeCurrency)
        : null;

    return (
        <div className="space-y-4">
            <div className="bg-bg border border-border rounded-lg p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="font-semibold truncate">
                        {selectedAsset.name || selectedAsset.currencyName || selectedAsset.symbol || selectedAsset.currencyCode}
                    </div>
                </div>
                <div className="shrink-0 px-2 py-1 bg-surface border border-border rounded-md font-mono text-xs text-text-muted">
                    {selectedAsset.symbol || selectedAsset.currencyCode}
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold mb-1">{t('simulation:modal.investmentDate')}</label>
                <DatePicker
                    value={investmentDate}
                    onChange={handleDateChange}
                    min={earliestDate || undefined}
                    max={todayIso()}
                />
                <p className="text-xs text-text-muted mt-1">{t('simulation:modal.investmentDateHint')}</p>

                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                    {datePriceLoading && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface border border-border text-text-muted">
                            <Loader2 className="animate-spin" size={12} />
                            {t('simulation:modal.datePriceLoading', 'Fiyat alınıyor…')}
                        </span>
                    )}
                    {!datePriceLoading && datePriceFmt && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/30 text-primary">
                            <Tag size={12} />
                            {t('simulation:modal.datePriceFound', 'O tarihteki fiyat')}: <span className="font-semibold">{datePriceFmt}</span>
                        </span>
                    )}
                    {!datePriceLoading && datePrice === false && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-warning/10 border border-warning/30 text-warning">
                            <Tag size={12} />
                            {t('simulation:modal.datePriceMissing', 'Bu tarih için fiyat bulunamadı')}
                        </span>
                    )}
                    {earliestLoading && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface border border-border text-text-muted">
                            <Loader2 className="animate-spin" size={12} />
                            {t('simulation:modal.earliestLoading')}
                        </span>
                    )}
                    {!earliestLoading && earliestDate && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface border border-border text-text-muted">
                            <Calendar size={12} />
                            {t('simulation:modal.earliestAvailable', { date: earliestDate })}
                        </span>
                    )}
                    {!earliestLoading && !earliestDate && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-warning/10 border border-warning/30 text-warning">
                            <Calendar size={12} />
                            {t('simulation:modal.earliestUnavailable')}
                        </span>
                    )}
                </div>
            </div>

            {/* Tutar ↔ Miktar (çift yönlü; o tarihteki fiyattan hesaplanır) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-semibold mb-1">{t('simulation:modal.amount')}</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amountTry}
                        onChange={(e) => handleAmount(e.target.value)}
                        placeholder="10000"
                        className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-1">{t('simulation:modal.quantity', 'Miktar')}</label>
                    <input
                        type="number"
                        step="0.00000001"
                        min="0"
                        value={quantity}
                        onChange={(e) => handleQuantity(e.target.value)}
                        disabled={priceNum <= 0}
                        placeholder={priceNum > 0 ? '1' : '—'}
                        title={priceNum <= 0 ? t('simulation:modal.quantityHint', 'Önce tarih seçin; miktar o tarihteki fiyattan hesaplanır.') : undefined}
                        className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>
            </div>
            {priceNum <= 0 && (
                <p className="-mt-2 text-[11px] text-text-muted">{t('simulation:modal.quantityHint', 'Önce tarih seçin; miktar o tarihteki fiyattan hesaplanır.')}</p>
            )}

            <div>
                <label className="block text-sm font-semibold mb-1">{t('simulation:modal.notes')}</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('simulation:modal.notesPlaceholder')}
                    rows="2"
                    className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                />
            </div>

            {previewResult && <PreviewBox previewResult={previewResult} amountTry={amountTry} />}

            <div className="flex gap-2 pt-2">
                <button
                    onClick={onBack}
                    disabled={previewing || saving}
                    className="px-4 py-2.5 bg-surface-hover hover:bg-surface-hover/80 rounded-lg font-semibold transition disabled:opacity-50 inline-flex items-center gap-2"
                >
                    <ChevronLeft size={16} /> {t('simulation:modal.stepBack')}
                </button>
                <button
                    onClick={handlePreview}
                    disabled={!canSubmit() || previewing || saving}
                    className="flex-1 px-4 py-2.5 bg-bg hover:bg-surface-hover border border-border rounded-lg font-semibold transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                    {previewing && <Loader2 className="animate-spin" size={16} />}
                    {t('simulation:actions.preview')}
                </button>
                <button
                    onClick={handleSave}
                    disabled={!canSubmit() || saving}
                    className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-fg rounded-lg font-semibold transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                    {saving && <Loader2 className="animate-spin" size={16} />}
                    {t('simulation:actions.save')}
                </button>
            </div>
        </div>
    );
}

function PreviewBox({ previewResult, amountTry }) {
    const { t } = useTranslation('simulation');
    return (
        <div className="bg-bg border border-border rounded-lg p-4">
            {previewResult.warning ? (
                <div className="text-warning text-sm">{previewResult.warning}</div>
            ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <PreviewCell label={t('result.invested')} value={`${Number(amountTry).toFixed(2)} ₺`} />
                    <PreviewCell label={t('result.currentValue')} value={`${Number(previewResult.currentValue).toFixed(2)} ₺`} />
                    <PreviewCell
                        label={t('result.pnl')}
                        value={`${Number(previewResult.pnlTry) >= 0 ? '+' : ''}${Number(previewResult.pnlTry).toFixed(2)} ₺`}
                        positive={Number(previewResult.pnlTry) >= 0}
                    />
                    <PreviewCell
                        label={t('result.pnlPct')}
                        value={`${Number(previewResult.pnlPct) >= 0 ? '+' : ''}${Number(previewResult.pnlPct).toFixed(2)}%`}
                        positive={Number(previewResult.pnlPct) >= 0}
                    />
                </div>
            )}
        </div>
    );
}

function PreviewCell({ label, value, positive }) {
    const colorClass = positive == null ? '' : (positive ? 'text-buy' : 'text-sell');
    return (
        <div>
            <div className="text-text-muted text-xs">{label}</div>
            <div className={`font-mono font-bold ${colorClass}`}>{value}</div>
        </div>
    );
}
