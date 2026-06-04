import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMarketData } from '../../../../hooks/useMarketData';
import FundTradingChart from '../../../../components/charts/FundTradingChart/FundTradingChart';
import AssetActions from '../../../../components/asset/AssetActions';
import NewsSection from '../../../../components/news/NewsSection.jsx';

export default function TurkishFundsDashboard() {
    const navigate = useNavigate();
    const { data: funds, selectedAsset, setSelectedAsset, loading } = useMarketData('tr-funds');
    const { t } = useTranslation(['markets', 'common', 'asset']);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 100;

    const filteredFunds = useMemo(() => {
        if (!funds) return [];
        let result = funds;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(f =>
                (f.name || f.currencyName || '').toLowerCase().includes(q) ||
                (f.symbol || f.currencyCode || '').toLowerCase().includes(q)
            );
            setCurrentPage(1);
        }
        return result;
    }, [funds, searchQuery]);

    const totalPages = Math.ceil(filteredFunds.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredFunds.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
    };

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
                    {t('markets:funds.trHeaderTitle')}
                </h1>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 h-[650px] shadow-2xl">
                    {selectedAsset ? (
                        <div className="h-full flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-3 bg-surface border border-border rounded-2xl px-4 py-3 shrink-0">
                                <div className="min-w-0">
                                    <div className="font-bold text-text truncate">{selectedAsset.symbol || selectedAsset.currencyCode}</div>
                                    <div className="text-xs text-text-muted truncate">{selectedAsset.name || selectedAsset.currencyName}</div>
                                </div>
                                <AssetActions asset={selectedAsset} assetCategory="TR_FUND" compact />
                            </div>
                            <div className="flex-1 min-h-0">
                                <FundTradingChart asset={selectedAsset} />
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full bg-surface rounded-2xl border border-border flex items-center justify-center text-text-muted">{t('common:actions.select')}</div>
                    )}
                </div>

                <div className="bg-surface border border-border rounded-2xl p-5 shadow-2xl flex flex-col h-[650px]">
                    <div className="relative mb-4">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            placeholder={t('markets:common.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-surface-2 border border-border text-text rounded-xl outline-none focus:border-buy transition text-sm"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-surface z-10">
                            <tr className="text-text-muted text-[10px] uppercase border-b border-border">
                                <th className="pb-2 font-bold">{t('markets:funds.fundCode')}</th>
                                <th className="pb-2 font-bold text-right">{t('common:labels.performance')}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {currentItems.map((item, i) => {
                                const code = item.symbol || item.currencyCode;
                                const isSelected = selectedAsset && (selectedAsset.symbol === code || selectedAsset.currencyCode === code);

                                const change = item.changePercent || 0;
                                const isPositive = change >= 0;

                                return (
                                    <tr key={i} onClick={() => setSelectedAsset(item)} className={`border-b border-border/50 cursor-pointer group ${isSelected ? 'bg-buy/10' : 'hover:bg-surface-2'}`}>
                                        <td className="py-3">
                                            <div className={`font-bold text-xs ${isSelected ? 'text-buy' : 'text-text group-hover:text-text'}`}>{code}</div>
                                            <div className="text-[9px] text-text-muted truncate max-w-[180px]">{item.name || item.currencyName}</div>
                                        </td>
                                        <td className="py-3 text-right font-mono text-xs font-bold">
                                            <span className={isPositive ? 'text-buy' : 'text-sell'}>
                                                {isPositive ? '+' : ''}{Number(change).toFixed(2)}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1 rounded bg-surface-2 text-text-muted disabled:opacity-50 hover:text-text border border-border">
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-text-muted text-xs font-bold">{currentPage} / {totalPages}</span>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1 rounded bg-surface-2 text-text-muted disabled:opacity-50 hover:text-text border border-border">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <NewsSection category="Yatırım Fonları" titleKey="news:categories.fund" accent="buy" />
          </div>
        </div>
    );
}
