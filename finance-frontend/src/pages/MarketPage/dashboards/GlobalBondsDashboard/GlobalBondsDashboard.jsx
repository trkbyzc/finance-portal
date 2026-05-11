import React from 'react';
import { ArrowLeft, Landmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarketData } from '../../../../hooks/useMarketData';
import TradingChart from '../../../../components/charts/TradingChart/TradingChart';

export default function GlobalBondsDashboard() {
    const navigate = useNavigate();
    const { data: bonds, selectedAsset, setSelectedAsset, loading } = useMarketData('bonds');

    if (loading) return <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-[#0b0e14] text-white p-6 lg:p-10">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#868993] hover:text-white mb-6 transition bg-[#1e222d] px-4 py-2 rounded-lg border border-[#2a2e39]">
                <ArrowLeft size={18} /> Geri Dön
            </button>

            <div className="mb-8 flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-center text-[#3b82f6]">
                    <Landmark size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Küresel Devlet Tahvilleri</h1>
                    <p className="text-[#868993] text-sm mt-1">Ülkelerin risk primleri ve getiri eğrileri</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 h-[600px] shadow-2xl rounded-2xl overflow-hidden border border-[#2a2e39] bg-[#131722] flex flex-col">
                    {selectedAsset ? (
                        <>
                            {/* 🚀 YENİ: GRAFİK ÜSTÜ DEV GETİRİ HEADER'I */}
                            <div className="p-4 md:p-6 border-b border-[#2a2e39] flex justify-between items-center bg-[#131722]">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        {selectedAsset.symbol}
                                        <span className="text-[10px] bg-[#3b82f6]/20 text-[#3b82f6] px-2 py-1 rounded border border-[#3b82f6]/30">DEVLET TAHVİLİ</span>
                                    </h2>
                                    <div className="text-sm text-[#868993] mt-1">{selectedAsset.name}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-mono font-bold text-[#3b82f6]">
                                        %{Number(selectedAsset.price || selectedAsset.yield || 0).toFixed(3)}
                                    </div>
                                    <div className={`font-mono font-bold text-sm ${selectedAsset.changePercent >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                                        {selectedAsset.changePercent >= 0 ? '+' : ''}{Number(selectedAsset.changePercent || 0).toFixed(2)}%
                                        <span className="text-[#868993] text-[10px] ml-1">(Günlük Değişim)</span>
                                    </div>
                                </div>
                            </div>

                            {/* TradingChart Alanı */}
                            <div className="flex-1 relative">
                                <TradingChart asset={selectedAsset} />
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#868993]">Lütfen listeden bir tahvil seçin.</div>
                    )}
                </div>

                {/* SAĞ: TAHVİL LİSTESİ */}
                <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl p-5 shadow-2xl flex flex-col h-[600px]">
                    <h3 className="text-sm font-bold text-[#868993] uppercase tracking-wider mb-4 border-b border-[#2a2e39] pb-3">Tahvil Listesi</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <tbody>
                            {bonds.map((bond, i) => {
                                const isSelected = selectedAsset && selectedAsset.symbol === bond.symbol;
                                const flagCode = bond.symbol?.split('.')[1]?.toLowerCase() || 'us';

                                return (
                                    <tr key={i} onClick={() => setSelectedAsset(bond)} className={`border-b border-[#2a2e39]/50 cursor-pointer group ${isSelected ? 'bg-[#3b82f6]/10' : 'hover:bg-[#1e222d]'}`}>
                                        <td className="py-3 flex items-center gap-3">
                                            <img src={`https://flagcdn.com/w20/${flagCode}.png`} alt="flag" className="w-5 h-3.5 object-cover rounded-sm opacity-80 group-hover:opacity-100" onError={(e) => e.target.style.display='none'} />
                                            <div>
                                                <div className={`font-bold text-xs ${isSelected ? 'text-[#3b82f6]' : 'text-[#d1d4dc] group-hover:text-white'}`}>{bond.symbol}</div>
                                                <div className="text-[9px] text-[#868993]">{bond.name}</div>
                                            </div>
                                        </td>
                                        <td className="py-3 text-right font-mono text-xs font-bold text-white">
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
    );
}