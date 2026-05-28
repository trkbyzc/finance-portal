import React from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TradingChart from '../../../components/charts/TradingChart/TradingChart.jsx';
import ComparisonSection from './ComparisonSection.jsx';
import NewsSection from '../../../components/news/NewsSection.jsx';
import { translateBondLabel, translateBondName, translateBondDate } from '../../../utils/bondLabelTranslator';

export default function BondDetailView({ asset, trBondsList, decodedSymbol, navigate }) {
    const { t } = useTranslation(['asset', 'markets', 'common']);
    return (
        <div className="min-h-screen bg-bg text-text p-4 md:p-6 lg:p-10">
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
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 bg-surface border border-border rounded-3xl p-1 h-[600px] shadow-2xl overflow-hidden flex flex-col">
                    <TradingChart asset={asset} theme="dark" />
                </div>
                <div className="bg-surface border border-border rounded-3xl p-6 shadow-2xl flex flex-col h-[600px]">
                    <h3 className="text-lg font-bold text-text mb-4 pb-4 border-b border-border flex items-center gap-2">
                        <Info size={18} className="text-primary" /> {t('asset:bond.maturity')}
                    </h3>
                    <div className="flex-1 overflow-y-auto hide-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="text-text-muted text-[11px] uppercase tracking-wider border-b border-border">
                                <th className="pb-3 font-bold w-1/3">{t('common:labels.symbol')}</th>
                                <th className="pb-3 font-bold w-1/3">{t('asset:bond.maturity')}</th>
                                <th className="pb-3 font-bold text-right w-1/3">{t('common:labels.date')}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {trBondsList.map((bond, i) => {
                                const isSelected = bond.symbol === decodedSymbol;
                                const shortSymbol = bond.symbol.replace('TP.', '').replace('.ORAN', '');
                                return (
                                    <tr key={i} onClick={() => navigate(`/chart/${encodeURIComponent(bond.symbol)}?cat=TR_BOND`)} className={`border-b border-border/50 cursor-pointer transition-colors group ${isSelected ? 'bg-primary/20' : 'hover:bg-surface-2'}`}>
                                        <td className="py-4"><span className={`font-bold text-[12px] ${isSelected ? 'text-primary' : 'text-text group-hover:text-text'}`}>{shortSymbol}</span></td>
                                        <td className="py-4 text-[12px] text-text-muted font-medium">{translateBondLabel(bond.label)}</td>
                                        <td className="py-4 text-[12px] text-right text-text-muted font-mono">{bond.maturityDate ? translateBondDate(bond.maturityDate) : '-'}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="mt-8">
                <ComparisonSection asset={asset} baseSymbol={asset.symbol} />
            </div>

            <NewsSection category="Tahvil & Faiz" titleKey="news:categories.bond" accent="primary" />
        </div>
    );
}
