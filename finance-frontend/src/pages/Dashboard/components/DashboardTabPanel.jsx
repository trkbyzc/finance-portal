import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function DashboardTabPanel({ tabs, activeTab, setActiveTab, tabData, tabLoading, navigate }) {
    return (
        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#2962ff] to-[#00c853] rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
            <div className="relative bg-[#131722] border border-[#2a2e39] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[420px]">
                {/* Tab Header */}
                <div className="flex bg-[#0a0e17] border-b border-[#2a2e39] overflow-x-auto hide-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'text-[#2962ff] border-[#2962ff] bg-[#2962ff]/5' : 'text-[#787b86] border-transparent hover:text-white'}`}
                        >
                            {tab.icon} {tab.title.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto hide-scrollbar">
                    {tabLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2962ff]"></div>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-[#2a2e39]/30">
                            {tabData.map((asset, i) => {
                                const symbol = asset.symbol || asset.currencyCode;
                                const price = asset.price || asset.forexSelling;
                                return (
                                    <tr key={i} onClick={() => navigate(`/chart/${symbol}`)} className="hover:bg-[#1e222d] cursor-pointer transition-colors group">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white group-hover:text-[#2962ff] transition-colors">{symbol}</span>
                                                <span className="text-[10px] text-[#787b86]">{asset.name || asset.currencyName}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-mono text-sm font-semibold">{price?.toLocaleString('tr-TR')}</td>
                                        <td className={`p-4 text-right font-mono text-xs font-bold ${asset.changePercent >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                                            {asset.changePercent > 0 ? '+' : ''}{(asset.changePercent || 0).toFixed(2)}%
                                        </td>
                                        <td className="pr-4 text-right text-[#2a2e39] group-hover:text-[#2962ff] transition-colors"><ChevronRight size={16}/></td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    )}
                </div>
                <button
                    onClick={() => {
                        const targetCategory = activeTab === 'stocks' ? 'tr-stocks' : activeTab;
                        navigate(`/markets/${targetCategory}/list`);
                    }}
                    className="bg-[#0a0e17] p-3 text-[10px] font-black text-[#787b86] hover:text-white border-t border-[#2a2e39] transition-colors uppercase tracking-widest"                >
                    Tüm {tabs.find(t => t.id === activeTab)?.title} Piyasasını Gör
                </button>
            </div>
        </div>
    );
}