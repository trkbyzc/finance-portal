import { useEffect, useState } from 'react';
import { ChevronLeft, Loader2, Calendar, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { simulationApi } from '../../../services/api/simulationApi';
import { fetchPriceOnDate } from '../../../utils/historicalPrice';

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * CreateSimulationModal'ın 3. adımı — tarih + tutar + notlar + preview sonucu.
 *
 * Asset seçildiğinde bu varlığın en erken historical date'ini fetch eder ve <input min>
 * olarak set eder; böylece kullanıcı veri olmayan eski tarihleri seçemez.
 */
export default function SimStep3Details({ selectedAsset, backendType, onPreview, onSave, onBack }) {
    const { t } = useTranslation(['simulation', 'common']);
    const [investmentDate, setInvestmentDate] = useState('');
    const [amountTry, setAmountTry] = useState('');
    const [notes, setNotes] = useState('');
    const [previewResult, setPreviewResult] = useState(null);
    const [previewing, setPreviewing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [earliestDate, setEarliestDate] = useState(null);
    const [earliestLoading, setEarliestLoading] = useState(false);
    const [datePrice, setDatePrice] = useState(null);
    const [datePriceLoading, setDatePriceLoading] = useState(false);

    const handleDateChange = async (v) => {
        setInvestmentDate(v);
        setPreviewResult(null);
        setDatePrice(null);
        const sym = selectedAsset?.symbol || selectedAsset?.currencyCode;
        if (!v || !sym) return;
        setDatePriceLoading(true);
        try {
            const p = await fetchPriceOnDate(sym, backendType, v);
            setDatePrice(p != null && p > 0 ? p : false);
        } finally {
            setDatePriceLoading(false);
        }
    };

    // Earliest historical date — backend'den asset'in en eski tarihini çek
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
        amountTry: parseFloat(amountTry),
        notes: notes?.trim() || null
    });

    const canSubmit = () => {
        if (!selectedAsset || !investmentDate) return false;
        const amt = parseFloat(amountTry);
        return !isNaN(amt) && amt > 0;
    };

    const handlePreview = async () => {
        if (!canSubmit()) return;
        setPreviewing(true);
        try {
            const result = await onPreview(buildBody());
            setPreviewResult(result);
        } catch (e) {
            console.error(e);
            alert(t('simulation:toast.previewError'));
        } finally {
            setPreviewing(false);
        }
    };

    const handleSave = async () => {
        if (!canSubmit()) return;
        setSaving(true);
        try {
            await onSave(buildBody());
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.message || t('simulation:toast.error'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-bg border border-border rounded-lg p-3">
                <div className="font-semibold">
                    {selectedAsset.name || selectedAsset.currencyName || selectedAsset.symbol || selectedAsset.currencyCode}
                </div>
                <div className="text-xs text-text-muted font-mono mt-0.5">
                    {selectedAsset.symbol || selectedAsset.currencyCode}
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold mb-1">{t('simulation:modal.investmentDate')}</label>
                <input
                    type="date"
                    value={investmentDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    min={earliestDate || undefined}
                    max={todayIso()}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-text-muted mt-1">{t('simulation:modal.investmentDateHint')}</p>
                {(datePriceLoading || datePrice !== null) && (
                    <div className="text-xs mt-1 inline-flex items-center gap-1">
                        {datePriceLoading ? (
                            <span className="text-text-muted inline-flex items-center gap-1"><Loader2 className="animate-spin" size={12} />{t('simulation:modal.datePriceLoading', 'Fiyat alınıyor…')}</span>
                        ) : datePrice ? (
                            <span className="text-primary inline-flex items-center gap-1"><Tag size={12} />{t('simulation:modal.datePriceFound', 'O tarihteki fiyat')}: {Number(datePrice).toLocaleString('tr-TR', { maximumFractionDigits: 4 })}</span>
                        ) : (
                            <span className="text-warning inline-flex items-center gap-1"><Tag size={12} />{t('simulation:modal.datePriceMissing', 'Bu tarih için fiyat bulunamadı')}</span>
                        )}
                    </div>
                )}
                <div className="text-xs mt-1 inline-flex items-center gap-1">
                    {earliestLoading ? (
                        <span className="text-text-muted inline-flex items-center gap-1">
                            <Loader2 className="animate-spin" size={12} />
                            {t('simulation:modal.earliestLoading')}
                        </span>
                    ) : earliestDate ? (
                        <span className="text-primary inline-flex items-center gap-1">
                            <Calendar size={12} />
                            {t('simulation:modal.earliestAvailable', { date: earliestDate })}
                        </span>
                    ) : (
                        <span className="text-warning inline-flex items-center gap-1">
                            <Calendar size={12} />
                            {t('simulation:modal.earliestUnavailable')}
                        </span>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold mb-1">{t('simulation:modal.amount')}</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountTry}
                    onChange={(e) => { setAmountTry(e.target.value); setPreviewResult(null); }}
                    placeholder="10000"
                    className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                />
            </div>

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
