import { useTranslation } from 'react-i18next';
import { SIM_ASSET_TYPES } from './simAssetTypes';

export default function SimStep1AssetType({ onSelect }) {
    const { t } = useTranslation('simulation');
    return (
        <div className="grid grid-cols-2 gap-3">
            {SIM_ASSET_TYPES.map(type => (
                <button
                    key={type.uiKey}
                    onClick={() => onSelect(type.uiKey)}
                    className="p-4 bg-bg hover:bg-surface-hover border border-border hover:border-primary rounded-lg text-left transition"
                >
                    <div className="font-semibold">{t(`types.${type.uiKey}`)}</div>
                    <div className="text-xs text-text-muted mt-1">{t(`types.${type.uiKey}Sub`)}</div>
                </button>
            ))}
        </div>
    );
}
