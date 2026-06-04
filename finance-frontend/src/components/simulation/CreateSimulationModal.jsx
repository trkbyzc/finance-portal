import { Fragment, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SIM_ASSET_TYPES } from './createModal/simAssetTypes';
import SimStep1AssetType from './createModal/SimStep1AssetType';
import SimStep2AssetList from './createModal/SimStep2AssetList';
import SimStep3Details from './createModal/SimStep3Details';

/**
 * 3-step simülasyon oluşturma wizard'ı. Step state + navigation burada;
 * her step ayrı component'te (createModal/ klasörü).
 *
 * Step 3'te kullanıcı önce "Önizle" sonra "Kaydet" butonuyla 2 farklı endpoint hit eder
 * (preview stateless, save persistent). Backend AssetType GOLD/BOND_TR için fallback
 * chain ile COMMODITY/BOND'a düşer; uiKey ile backendValue ayrımı tutulur.
 */
export default function CreateSimulationModal({ isOpen, onClose, onPreview, onSave }) {
    const { t } = useTranslation('simulation');
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);

    const backendType = (SIM_ASSET_TYPES.find(at => at.uiKey === selectedType) || {}).backendValue || selectedType;

    const resetAll = () => {
        setStep(1);
        setSelectedType('');
        setSelectedAsset(null);
    };

    // Modal her açıldığında sıfırdan başlasın (önceki varlık tipi/menüsü hatırlanmasın)
    useEffect(() => {
        if (isOpen) resetAll();
    }, [isOpen]);

    const handleClose = () => {
        resetAll();
        onClose();
    };

    const handleSave = async (body) => {
        await onSave(body);
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={handleClose} className="absolute top-3 right-3 text-text-muted hover:text-text z-10">
                    <X size={20} />
                </button>

                <div className="p-4 md:p-6">
                    <h2 className="text-xl font-bold mb-1">{t('modal.createTitle')}</h2>
                    <p className="text-text-muted text-sm mb-5">
                        {step === 1 && t('modal.stepType')}
                        {step === 2 && t('modal.stepAsset')}
                        {step === 3 && t('modal.stepDetails')}
                    </p>

                    <div className="flex items-center justify-center mb-6 gap-1">
                        {[1, 2, 3].map(n => (
                            <Fragment key={n}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    step >= n ? 'bg-primary text-primary-fg' : 'bg-surface-hover text-text-muted'
                                }`}>{n}</div>
                                {n < 3 && <div className={`w-12 h-1 ${step > n ? 'bg-primary' : 'bg-surface-hover'}`} />}
                            </Fragment>
                        ))}
                    </div>

                    {step === 1 && (
                        <SimStep1AssetType onSelect={(uiKey) => { setSelectedType(uiKey); setStep(2); }} />
                    )}
                    {step === 2 && (
                        <SimStep2AssetList
                            selectedType={selectedType}
                            onSelect={(asset) => { setSelectedAsset(asset); setStep(3); }}
                            onBack={() => setStep(1)}
                        />
                    )}
                    {step === 3 && selectedAsset && (
                        <SimStep3Details
                            selectedAsset={selectedAsset}
                            backendType={backendType}
                            onPreview={onPreview}
                            onSave={handleSave}
                            onBack={() => setStep(2)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
