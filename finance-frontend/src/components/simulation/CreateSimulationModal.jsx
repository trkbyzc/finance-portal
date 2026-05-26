import React, { useState, useEffect } from 'react';
import { X, Search, ChevronLeft, Loader2, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../config/apiClient';
import { simulationApi } from '../../services/api/simulationApi';

// `uiKey` → i18n display name (simulation:types.*)
// `backendValue` → AssetType enum'a map'lenir (GOLD/BOND_TR sadece UI ayrımı;
//   backend tarafında zaten COMMODITY/BOND case'lerinde fallback chain var).
const ASSET_TYPES = [
    { uiKey: 'STOCK',    backendValue: 'STOCK',     endpoint: '/market-data/stocks' },
    { uiKey: 'CRYPTO',   backendValue: 'CRYPTO',    endpoint: '/market-data/crypto-currencies' },
    { uiKey: 'CURRENCY', backendValue: 'CURRENCY',  endpoint: '/market-data/currencies' },
    { uiKey: 'GOLD',     backendValue: 'COMMODITY', endpoint: '/market-data/turkish-gold' },
    { uiKey: 'COMMODITY',backendValue: 'COMMODITY', endpoint: '/market-data/commodities' },
    { uiKey: 'BOND_TR',  backendValue: 'BOND',      endpoint: '/market-data/tr-bonds' },
    { uiKey: 'BOND',     backendValue: 'BOND',      endpoint: '/market-data/bonds' },
    { uiKey: 'FUND',     backendValue: 'FUND',      endpoint: '/market-data/tr-funds' }
];

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function CreateSimulationModal({ isOpen, onClose, onPreview, onSave }) {
    const { t } = useTranslation(['simulation', 'common', 'navbar']);
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [investmentDate, setInvestmentDate] = useState('');
    const [amountTry, setAmountTry] = useState('');
    const [notes, setNotes] = useState('');
    const [previewResult, setPreviewResult] = useState(null);
    const [previewing, setPreviewing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [earliestDate, setEarliestDate] = useState(null);
    const [earliestLoading, setEarliestLoading] = useState(false);

    const currentBackendType = () => {
        const cfg = ASSET_TYPES.find(at => at.uiKey === selectedType);
        return cfg ? cfg.backendValue : selectedType;
    };

    // Asset seçildiğinde (step 3'e geçildiğinde) bu varlığın "en erken historical date"ini sor.
    useEffect(() => {
        if (step !== 3 || !selectedAsset || !selectedType) return;
        const sym = selectedAsset.symbol || selectedAsset.currencyCode;
        if (!sym) return;
        setEarliestLoading(true);
        setEarliestDate(null);
        simulationApi.getEarliestDate(sym, currentBackendType())
            .then(res => setEarliestDate(res?.earliestDate || null))
            .catch(err => { console.error('earliestDate fetch failed:', err); setEarliestDate(null); })
            .finally(() => setEarliestLoading(false));
    }, [step, selectedAsset, selectedType]);

    const { data: assets, isLoading } = useQuery({
        queryKey: ['assets', selectedType],
        queryFn: async () => {
            if (!selectedType) return [];
            const cfg = ASSET_TYPES.find(at => at.uiKey === selectedType);
            if (!cfg) return [];
            return await apiClient.get(cfg.endpoint);
        },
        enabled: !!selectedType
    });

    const filteredAssets = (assets || []).filter(a => {
        const q = searchTerm.toLowerCase();
        const sym = (a.symbol || '').toLowerCase();
        const name = (a.name || '').toLowerCase();
        const code = (a.currencyCode || '').toLowerCase();
        return sym.includes(q) || name.includes(q) || code.includes(q);
    });

    const resetAll = () => {
        setStep(1); setSelectedType(''); setSelectedAsset(null);
        setSearchTerm(''); setInvestmentDate(''); setAmountTry('');
        setNotes(''); setPreviewResult(null);
        setEarliestDate(null); setEarliestLoading(false);
    };

    const handleClose = () => { resetAll(); onClose(); };

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
            handleClose();
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.message || t('simulation:toast.error'));
        } finally {
            setSaving(false);
        }
    };

    const buildBody = () => ({
        symbol: selectedAsset.symbol || selectedAsset.currencyCode,
        assetType: currentBackendType(),
        investmentDate,
        amountTry: parseFloat(amountTry),
        notes: notes?.trim() || null
    });

    const canSubmit = () => {
        if (!selectedAsset || !investmentDate) return false;
        const amt = parseFloat(amountTry);
        return !isNaN(amt) && amt > 0;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={handleClose} className="absolute top-3 right-3 text-text-muted hover:text-text z-10">
                    <X size={20} />
                </button>

                <div className="p-6">
                    <h2 className="text-xl font-bold mb-1">{t('simulation:modal.createTitle')}</h2>
                    <p className="text-text-muted text-sm mb-5">
                        {step === 1 && t('simulation:modal.stepType')}
                        {step === 2 && t('simulation:modal.stepAsset')}
                        {step === 3 && t('simulation:modal.stepDetails')}
                    </p>

                    <div className="flex items-center justify-center mb-6 gap-1">
                        {[1, 2, 3].map(n => (
                            <React.Fragment key={n}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    step >= n ? 'bg-primary text-primary-fg' : 'bg-surface-hover text-text-muted'
                                }`}>{n}</div>
                                {n < 3 && <div className={`w-12 h-1 ${step > n ? 'bg-primary' : 'bg-surface-hover'}`} />}
                            </React.Fragment>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="grid grid-cols-2 gap-3">
                            {ASSET_TYPES.map(type => (
                                <button
                                    key={type.uiKey}
                                    onClick={() => { setSelectedType(type.uiKey); setStep(2); setSearchTerm(''); }}
                                    className="p-4 bg-bg hover:bg-surface-hover border border-border hover:border-primary rounded-lg text-left transition"
                                >
                                    <div className="font-semibold">{t(`simulation:types.${type.uiKey}`)}</div>
                                    <div className="text-xs text-text-muted mt-1">{t(`simulation:types.${type.uiKey}Sub`)}</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('common:actions.search')}
                                    className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary"
                                    autoFocus
                                />
                            </div>
                            <div className="max-h-80 overflow-y-auto space-y-2">
                                {isLoading ? (
                                    <div className="text-center py-8 text-text-muted">{t('common:status.loading')}</div>
                                ) : filteredAssets.length === 0 ? (
                                    <div className="text-center py-8 text-text-muted">{t('common:status.noResults')}</div>
                                ) : filteredAssets.map((asset, idx) => {
                                    const symbol = asset.symbol || asset.currencyCode;
                                    const name = asset.name || asset.currencyName;
                                    const price = asset.price || asset.forexSelling || asset.value || asset.lastPrice || asset.unitPrice || 0;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => { setSelectedAsset(asset); setStep(3); }}
                                            className="w-full p-3 bg-bg hover:bg-surface-hover border border-border hover:border-primary rounded-lg text-left flex justify-between items-center transition"
                                        >
                                            <div>
                                                <div className="font-semibold">{symbol}</div>
                                                <div className="text-sm text-text-muted">{name}</div>
                                            </div>
                                            <div className="text-right">
                                                {price > 0 ? (
                                                    <div className="font-semibold">{Number(price).toFixed(2)} ₺</div>
                                                ) : (
                                                    <div className="text-xs text-text-muted">-</div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setStep(1)}
                                className="mt-4 w-full px-4 py-2 bg-surface-hover hover:bg-surface-hover/80 rounded-lg font-semibold transition inline-flex items-center justify-center gap-2"
                            >
                                <ChevronLeft size={16} /> {t('simulation:modal.stepBack')}
                            </button>
                        </div>
                    )}

                    {step === 3 && selectedAsset && (
                        <div className="space-y-4">
                            <div className="bg-bg border border-border rounded-lg p-3">
                                <div className="font-semibold">{selectedAsset.name || selectedAsset.currencyName || selectedAsset.symbol || selectedAsset.currencyCode}</div>
                                <div className="text-xs text-text-muted font-mono mt-0.5">{selectedAsset.symbol || selectedAsset.currencyCode}</div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1">{t('simulation:modal.investmentDate')}</label>
                                <input
                                    type="date"
                                    value={investmentDate}
                                    onChange={(e) => { setInvestmentDate(e.target.value); setPreviewResult(null); }}
                                    min={earliestDate || undefined}
                                    max={todayIso()}
                                    className="w-full bg-bg border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                                />
                                <p className="text-xs text-text-muted mt-1">{t('simulation:modal.investmentDateHint')}</p>
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

                            {previewResult && (
                                <div className="bg-bg border border-border rounded-lg p-4">
                                    {previewResult.warning ? (
                                        <div className="text-warning text-sm">{previewResult.warning}</div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <div className="text-text-muted text-xs">{t('simulation:result.invested')}</div>
                                                <div className="font-mono font-bold">{Number(amountTry).toFixed(2)} ₺</div>
                                            </div>
                                            <div>
                                                <div className="text-text-muted text-xs">{t('simulation:result.currentValue')}</div>
                                                <div className="font-mono font-bold">{Number(previewResult.currentValue).toFixed(2)} ₺</div>
                                            </div>
                                            <div>
                                                <div className="text-text-muted text-xs">{t('simulation:result.pnl')}</div>
                                                <div className={`font-mono font-bold ${Number(previewResult.pnlTry) >= 0 ? 'text-buy' : 'text-sell'}`}>
                                                    {Number(previewResult.pnlTry) >= 0 ? '+' : ''}{Number(previewResult.pnlTry).toFixed(2)} ₺
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-text-muted text-xs">{t('simulation:result.pnlPct')}</div>
                                                <div className={`font-mono font-bold ${Number(previewResult.pnlPct) >= 0 ? 'text-buy' : 'text-sell'}`}>
                                                    {Number(previewResult.pnlPct) >= 0 ? '+' : ''}{Number(previewResult.pnlPct).toFixed(2)}%
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setStep(2)}
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
                    )}
                </div>
            </div>
        </div>
    );
}
