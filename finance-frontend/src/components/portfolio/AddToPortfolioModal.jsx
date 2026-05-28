import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../config/apiClient';
import { useCurrency } from '../../context/CurrencyContext';
import { PORTFOLIO_ASSET_TYPES } from './addModal/portfolioAssetTypes';
import StepIndicator from './addModal/StepIndicator';
import Step1AssetType from './addModal/Step1AssetType';
import Step2AssetList from './addModal/Step2AssetList';
import Step3EntryForm from './addModal/Step3EntryForm';

/**
 * 3-step wizard: tip → varlık → giriş formu. Orchestrator: state ve step navigation burada;
 * her step ayrı component'te (addModal/ klasörü). FUND seçilince step 2'den 3'e geçerken
 * fiyat 0 dönüyorsa burada historical endpoint'inden son fiyatı çekip enrich ediyoruz.
 */
const AddToPortfolioModal = ({ isOpen, onClose, onSubmit }) => {
    const { t } = useTranslation('portfolio');
    const { currency: displayCurrency, toggleCurrency } = useCurrency();
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [fetchingPrice, setFetchingPrice] = useState(false);

    const selectedBackendValue = PORTFOLIO_ASSET_TYPES.find(at => at.uiKey === selectedType)?.backendValue;

    const resetAndClose = () => {
        setStep(1);
        setSelectedType('');
        setSelectedAsset(null);
        onClose();
    };

    const handleTypeSelect = (type) => {
        setSelectedType(type);
        setStep(2);
        setSelectedAsset(null);
    };

    const handleAssetSelect = async (asset) => {
        if (selectedType === 'FUND') {
            // FUND endpoint'lerde fiyat 0 dönebiliyor — TR_FUND historical'dan son fiyatı çek
            setFetchingPrice(true);
            try {
                const symbol = asset.symbol || asset.currencyCode;
                const chartData = await apiClient.get('/market-data/historical', {
                    params: { symbol, category: 'TR_FUND', range: '1d', interval: '1d' }
                });
                if (chartData && chartData.length > 0) {
                    const last = chartData[chartData.length - 1];
                    asset.currentPrice = last.price || last.close || 0;
                }
            } catch (error) {
                console.error('Fund price fetch failed:', error);
                asset.currentPrice = 0;
            } finally {
                setFetchingPrice(false);
            }
        }
        setSelectedAsset({ ...asset });
        setStep(3);
    };

    const handleSubmit = async (payload) => {
        await onSubmit(payload);
        resetAndClose();
    };

    const handleBack = () => {
        if (step === 3) {
            setStep(2);
            setSelectedAsset(null);
        } else if (step === 2) {
            setStep(1);
            setSelectedType('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-2 rounded-lg w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={resetAndClose} className="absolute top-4 right-4 text-text-muted hover:text-text z-10">
                    <X size={24} />
                </button>

                <div className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4 md:mb-6 pr-8">
                        <h2 className="text-2xl font-bold">{t('modal.addTitle')}</h2>
                        <button
                            type="button"
                            onClick={toggleCurrency}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-bg hover:bg-surface-hover text-sm font-semibold transition"
                            title={t('modal.toggleCurrency', 'Para birimini değiştir')}
                        >
                            <span className={displayCurrency === 'TRY' ? 'text-primary' : 'text-text-muted'}>₺</span>
                            <span className="text-text-muted">/</span>
                            <span className={displayCurrency === 'USD' ? 'text-primary' : 'text-text-muted'}>$</span>
                        </button>
                    </div>

                    <StepIndicator step={step} total={3} />

                    {step === 1 && <Step1AssetType onSelect={handleTypeSelect} />}
                    {step === 2 && (
                        <Step2AssetList
                            selectedType={selectedType}
                            onSelect={handleAssetSelect}
                            onBack={handleBack}
                            fetchingPrice={fetchingPrice}
                        />
                    )}
                    {step === 3 && selectedAsset && (
                        <Step3EntryForm
                            selectedAsset={selectedAsset}
                            selectedType={selectedType}
                            selectedBackendValue={selectedBackendValue}
                            onSubmit={handleSubmit}
                            onBack={handleBack}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddToPortfolioModal;
