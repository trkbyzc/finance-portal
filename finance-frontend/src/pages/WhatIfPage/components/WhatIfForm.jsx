import { Plus, Loader2, GitCompare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import WhatIfAssetChip from './WhatIfAssetChip';
import DatePicker from '../../../components/common/DatePicker';

/**
 * Karşılaştırma formu: mode toggle (Tutar/Miktar), tarih, tutar (sadece amount mode),
 * compare butonu ve asset chip listesi. State parent'ta tutulur, callback'lerle yönetilir.
 */
export default function WhatIfForm({
    investmentDate, setInvestmentDate,
    amountTry, setAmountTry,
    inputMode, setInputMode,
    assets, onRemoveAsset, onQuantityChange,
    onOpenPicker,
    onCompare,
    canCompare,
    isPending,
    todayStr
}) {
    const { t } = useTranslation(['whatIf', 'common']);

    return (
        <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
            {/* Mode toggle */}
            <div className="mb-4 flex items-center gap-1 p-1 bg-bg border border-border rounded-lg w-fit">
                <button
                    type="button"
                    onClick={() => setInputMode('amount')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                        inputMode === 'amount' ? 'bg-primary text-primary-fg' : 'text-text-muted hover:text-text'
                    }`}
                >
                    {t('whatIf:form.modeAmount', 'Tutar')}
                </button>
                <button
                    type="button"
                    onClick={() => setInputMode('quantity')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                        inputMode === 'quantity' ? 'bg-primary text-primary-fg' : 'text-text-muted hover:text-text'
                    }`}
                >
                    {t('whatIf:form.modeQuantity', 'Miktar')}
                </button>
            </div>

            {/* Date + (amount) + compare button */}
            <div className={`grid grid-cols-1 ${inputMode === 'amount' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 mb-4`}>
                <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1 uppercase">
                        {t('whatIf:form.investmentDate')}
                    </label>
                    <DatePicker
                        value={investmentDate}
                        onChange={setInvestmentDate}
                        max={todayStr}
                    />
                </div>
                {inputMode === 'amount' && (
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-1 uppercase">
                            {t('whatIf:form.amount')} (TRY)
                        </label>
                        <input
                            type="number"
                            value={amountTry}
                            onChange={(e) => setAmountTry(e.target.value)}
                            placeholder="10000"
                            min="0"
                            step="100"
                            className="w-full bg-bg border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                        />
                    </div>
                )}
                <div className="flex items-end">
                    <button
                        onClick={onCompare}
                        disabled={!canCompare}
                        className="w-full px-4 py-2 bg-primary hover:bg-primary-hover text-primary-fg rounded-lg font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    >
                        {isPending ? <Loader2 className="animate-spin" size={16} /> : <GitCompare size={16} />}
                        {t('whatIf:form.compare')}
                    </button>
                </div>
            </div>

            {/* Asset chips */}
            <div>
                <label className="block text-xs font-semibold text-text-muted mb-2 uppercase">
                    {t('whatIf:form.assets')} ({assets.length})
                    {inputMode === 'quantity' && (
                        <span className="ml-2 text-[10px] normal-case font-normal text-text-muted/70">
                            — {t('whatIf:form.quantityHint', 'her varlık için miktar gir')}
                        </span>
                    )}
                </label>
                <div className={`flex flex-wrap ${inputMode === 'quantity' ? 'items-start' : 'items-center'} gap-2`}>
                    {assets.map((a, idx) => (
                        <WhatIfAssetChip
                            key={`${a.assetType}:${a.symbol}`}
                            asset={a}
                            idx={idx}
                            inputMode={inputMode}
                            investmentDate={investmentDate}
                            onRemove={() => onRemoveAsset(idx)}
                            onQuantityChange={(v) => onQuantityChange(idx, v)}
                        />
                    ))}
                    <button
                        onClick={onOpenPicker}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm font-semibold transition self-start"
                    >
                        <Plus size={14} /> {t('whatIf:form.addCompare')}
                    </button>
                </div>
                {assets.length === 0 && (
                    <p className="text-xs text-text-muted mt-2">{t('whatIf:form.assetsHint')}</p>
                )}
            </div>
        </div>
    );
}
