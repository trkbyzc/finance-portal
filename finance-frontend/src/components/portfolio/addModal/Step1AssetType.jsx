import { useTranslation } from 'react-i18next';
import { PORTFOLIO_ASSET_TYPES } from './portfolioAssetTypes';

/**
 * AddToPortfolioModal step 1 — asset type grid. Seçim onSelect callback'i ile parent'a iletilir,
 * parent step'i ileri taşır.
 */
export default function Step1AssetType({ onSelect }) {
    const { t } = useTranslation('common');

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">{t('labels.type')}</h3>
            <div className="grid grid-cols-2 gap-3">
                {PORTFOLIO_ASSET_TYPES.map(type => (
                    <button
                        key={type.uiKey}
                        onClick={() => onSelect(type.uiKey)}
                        className="p-4 bg-bg hover:bg-surface-hover border border-border hover:border-primary rounded-lg transition text-left"
                    >
                        <div className="font-semibold">{t('assetTypes.' + type.uiKey, type.uiKey)}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}
