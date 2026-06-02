import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMarketData } from '../../../../hooks/useMarketData';
import TradingChart from '../../../../components/charts/TradingChart/TradingChart';

export default function GlobalBondsDashboard() {
    const navigate = useNavigate();
    const { data: bonds, selectedAsset, setSelectedAsset, loading } = useMarketData('bonds');
    const { t } = useTranslation(['markets', 'common', 'asset']);

    if (loading) return <div className="min-h-screen bg-bg flex items-center justify-center">{t('common:status.loading')}</div>;

    return (
        <div className="min-h-screen bg-bg text-text">
          <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-muted hover:text-text mb-6 transition bg-surface-2 px-4 py-2 rounded-lg border border-border">
                <ArrowLeft size={18} /> {t('asset:back')}
            </button>

            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-black uppercase text-text tracking-tight flex items-center gap-3">
                    <span className="w-2 h-8 bg-primary rounded-full"></span>
                    {t('markets:bonds.headerTitle')}
                </h1>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 h-[600px] shadow-2xl rounded-2xl overflow-hidden border border-border bg-surface flex flex-col">
                    {selectedAsset ? (
                        <>
                            <div className="p-4 md:p-6 border-b border-border flex justify-between items-center bg-surface">
                                <div>
                                    <h2 className="text-2xl font-bold text-text flex items-center gap-2">
                                        {selectedAsset.symbol}
                                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded border border-primary/30">{t('markets:bonds.treasury').toUpperCase()}</span>
                                    </h2>
                                    <div className="text-sm text-text-muted mt-1">{selectedAsset.name}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-mono font-bold text-primary">
                                        %{Number(selectedAsset.price || selectedAsset.yield || 0).toFixed(3)}
                                    </div>
                                    <div className={`font-mono font-bold text-sm ${selectedAsset.changePercent >= 0 ? 'text-buy' : 'text-sell'}`}>
                                        {selectedAsset.changePercent >= 0 ? '+' : ''}{Number(selectedAsset.changePercent || 0).toFixed(2)}%
                                        <span className="text-text-muted text-[10px] ml-1">({t('asset:changeToday')})</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 relative">
                                <TradingChart asset={selectedAsset} />
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted">{t('common:actions.select')}</div>
                    )}
                </div>

                <div className="bg-surface border border-border rounded-2xl p-5 shadow-2xl flex flex-col h-[600px]">
                    <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 border-b border-border pb-3">{t('markets:bonds.headerTitle')}</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <tbody>
                            {bonds.map((bond, i) => {
                                const isSelected = selectedAsset && selectedAsset.symbol === bond.symbol;
                                const flagCode = bond.symbol?.split('.')[1]?.toLowerCase() || 'us';

                                return (
                                    <tr key={i} onClick={() => setSelectedAsset(bond)} className={`border-b border-border/50 cursor-pointer group ${isSelected ? 'bg-primary/10' : 'hover:bg-surface-2'}`}>
                                        <td className="py-3 flex items-center gap-3">
                                            <img src={`https://flagcdn.com/w20/${flagCode}.png`} alt="flag" className="w-5 h-3.5 object-cover rounded-sm opacity-80 group-hover:opacity-100" onError={(e) => e.target.style.display='none'} />
                                            <div>
                                                <div className={`font-bold text-xs ${isSelected ? 'text-primary' : 'text-text group-hover:text-text'}`}>{bond.symbol}</div>
                                                <div className="text-[9px] text-text-muted">{bond.name}</div>
                                            </div>
                                        </td>
                                        <td className="py-3 text-right font-mono text-xs font-bold text-text">
                                            %{Number(bond.price || bond.yield || 0).toFixed(3)}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          </div>
        </div>
    );
}
