import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TradingChart from '../../../components/charts/TradingChart/TradingChart.jsx';
import ComparisonSection from './ComparisonSection.jsx';
import AssetActions from '../../../components/asset/AssetActions.jsx';
import { translateBondName } from '../../../utils/bondLabelTranslator';

export default function BondDetailView({ asset, navigate }) {
    const { t } = useTranslation(['asset', 'markets', 'common']);
    return (
        <div className="min-h-screen bg-bg text-text">
          <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-text-muted hover:text-text mb-6 transition bg-surface-2 px-4 py-2 rounded-lg border border-border hover:border-border-strong w-fit"
            >
                <ArrowLeft size={18} /> {t('asset:back')}
            </button>

            <div className="mb-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                <img src="https://flagcdn.com/w80/tr.png" alt="TR" className="w-20 h-20 rounded-full object-cover border-4 border-border shadow-lg shrink-0" />
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-text tracking-tight">
                        {asset.name ? translateBondName(asset.name) : t('markets:bonds.trHeaderTitle')}
                    </h1>
                    <div className="flex flex-wrap items-end gap-6 md:gap-10 mt-3">
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl md:text-5xl font-mono font-bold text-buy">
                                    {Number(asset.yield || 0).toFixed(3)}%
                                </span>
                            </div>
                            <span className="text-text-muted text-sm font-bold uppercase tracking-widest mt-1 block">{t('asset:bond.yield')}</span>
                        </div>
                        <div className="hidden md:block w-px h-12 bg-surface-hover mb-2"></div>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl md:text-3xl font-mono font-bold text-text">100.000</span>
                                <span className="text-text-muted font-bold text-sm">% par</span>
                            </div>
                            <span className="text-text-muted text-sm font-bold uppercase tracking-widest mt-1 block">{t('common:labels.price')}</span>
                        </div>
                    </div>
                </div>
                <AssetActions asset={asset} assetCategory="BOND" className="md:ml-auto" />
            </div>

            <div className="bg-surface border border-border rounded-3xl p-1 h-150 shadow-2xl overflow-hidden flex flex-col">
                <TradingChart asset={asset} theme="dark" />
            </div>
            <div className="mt-8">
                <ComparisonSection asset={asset} baseSymbol={asset.symbol} />
            </div>
          </div>
        </div>
    );
}
