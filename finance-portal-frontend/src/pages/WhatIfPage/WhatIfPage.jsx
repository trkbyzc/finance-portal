import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { GitCompare, Loader2 } from 'lucide-react';

import { whatIfApi } from '../../services/api/whatIfApi';
import BaseAssetPickerModal from '../../components/common/BaseAssetPickerModal';
import WhatIfForm from './components/WhatIfForm';
import WhatIfResultChart from './components/WhatIfResultChart';
import WhatIfResultCards from './components/WhatIfResultCards';

/**
 * "Ne olurdu?" karşılaştırma sayfası — orchestrator.
 *
 * State + handler'lar burada; UI parçaları (form / chart / result cards) ayrı componentlere
 * bölünmüş, callback'lerle yönetiliyor. İki giriş modu:
 *   - Tutar (amount): tek bir TRY tutarı tüm assetlere uygulanır
 *   - Miktar (quantity): her asset için ayrı quantity, backend entry-date fiyatından amountTry hesaplar
 */
export default function WhatIfPage() {
    const { t } = useTranslation(['whatIf', 'common']);

    const [investmentDate, setInvestmentDate] = useState('');
    const [amountTry, setAmountTry] = useState('');
    const [inputMode, setInputMode] = useState('amount'); // 'amount' | 'quantity'
    const [assets, setAssets] = useState([]); // [{symbol, assetType, label, quantity?}]
    const [pickerOpen, setPickerOpen] = useState(false);
    const [result, setResult] = useState(null);

    const compareMutation = useMutation({
        mutationFn: whatIfApi.compare,
        onSuccess: (data) => setResult(data),
        onError: () => setResult(null)
    });

    const invalidateResult = () => setResult(null);

    const handleAddAsset = (asset) => {
        const key = `${asset.assetType}:${asset.symbol}`;
        if (assets.find(a => `${a.assetType}:${a.symbol}` === key)) return;
        setAssets([...assets, { ...asset, quantity: 1 }]);
        setPickerOpen(false);
        invalidateResult();
    };

    const handleRemoveAsset = (idx) => {
        setAssets(assets.filter((_, i) => i !== idx));
        invalidateResult();
    };

    const handleQuantityChange = (idx, value) => {
        const num = Number.parseFloat(value);
        setAssets(assets.map((a, i) => i === idx ? { ...a, quantity: Number.isNaN(num) ? '' : num } : a));
        invalidateResult();
    };

    const handleCompare = () => {
        if (!investmentDate || assets.length === 0) return;
        const isQuantityMode = inputMode === 'quantity';
        if (isQuantityMode) {
            if (!assets.every(a => Number(a.quantity) > 0)) return;
        } else {
            if (!amountTry || Number.parseFloat(amountTry) <= 0) return;
        }
        const payload = {
            investmentDate,
            amountTry: isQuantityMode ? null : Number.parseFloat(amountTry),
            assets: assets.map(a => isQuantityMode
                ? { symbol: a.symbol, assetType: a.assetType, quantity: Number(a.quantity) }
                : { symbol: a.symbol, assetType: a.assetType }
            )
        };
        compareMutation.mutate(payload);
    };

    const canCompare = (() => {
        if (!investmentDate || assets.length === 0 || compareMutation.isPending) return false;
        if (inputMode === 'amount') return amountTry && Number.parseFloat(amountTry) > 0;
        return assets.every(a => Number(a.quantity) > 0);
    })();

    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <div className="min-h-screen bg-bg text-text p-4 md:p-8">
            <div className="max-w-[1400px] mx-auto">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                        <GitCompare size={20} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold">{t('whatIf:pageTitle')}</h1>
                </div>
                <p className="text-text-muted mb-8">{t('whatIf:pageSubtitle')}</p>

                <WhatIfForm
                    investmentDate={investmentDate}
                    setInvestmentDate={(v) => { setInvestmentDate(v); invalidateResult(); }}
                    amountTry={amountTry}
                    setAmountTry={(v) => { setAmountTry(v); invalidateResult(); }}
                    inputMode={inputMode}
                    setInputMode={(v) => { setInputMode(v); invalidateResult(); }}
                    assets={assets}
                    onRemoveAsset={handleRemoveAsset}
                    onQuantityChange={handleQuantityChange}
                    onOpenPicker={() => setPickerOpen(true)}
                    onCompare={handleCompare}
                    canCompare={canCompare}
                    isPending={compareMutation.isPending}
                    todayStr={todayStr}
                />

                {compareMutation.isPending ? (
                    <div className="flex items-center justify-center py-20 text-text-muted">
                        <Loader2 className="animate-spin mr-3" size={24} />
                        <span>{t('common:status.loading')}</span>
                    </div>
                ) : compareMutation.isError ? (
                    <div className="bg-sell/10 border border-sell/30 rounded-xl p-6 text-sell">
                        {t('whatIf:toast.error')}
                    </div>
                ) : !result ? (
                    <div className="bg-surface border border-border rounded-2xl p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-4 flex items-center justify-center text-primary">
                            <GitCompare size={28} />
                        </div>
                        <h2 className="text-xl font-bold mb-2">{t('whatIf:empty.title')}</h2>
                        <p className="text-text-muted max-w-md mx-auto">{t('whatIf:empty.subtitle')}</p>
                    </div>
                ) : (
                    <>
                        <WhatIfResultChart result={result} />
                        <WhatIfResultCards result={result} />
                    </>
                )}

                <BaseAssetPickerModal
                    isOpen={pickerOpen}
                    onClose={() => setPickerOpen(false)}
                    titleKey="whatIf:modal.title"
                    excludeKeys={assets.map(a => `${a.assetType}:${a.symbol}`)}
                    onSelect={({ symbol, assetType, label }) => {
                        handleAddAsset({ symbol, assetType, label });
                        setPickerOpen(false);
                    }}
                />
            </div>
        </div>
    );
}
