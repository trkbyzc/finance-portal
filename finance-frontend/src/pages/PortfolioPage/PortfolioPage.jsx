import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import { portfolioApi } from '../../services/api/portfolioApi';
import AddToPortfolioModal from '../../components/portfolio/AddToPortfolioModal';
import BuyMoreModal from '../../components/portfolio/BuyMoreModal';
import SellModal from '../../components/portfolio/SellModal';
import PortfolioStats from '../../components/portfolio/PortfolioStats';
import PortfolioCharts from '../../components/portfolio/PortfolioCharts';
import PortfolioTabs from '../../components/portfolio/PortfolioTabs';
import TransactionHistoryModal from '../../components/portfolio/TransactionHistoryModal';
import HoldingsTable from '../../components/portfolio/HoldingsTable';
import usePortfolioPricing from './hooks/usePortfolioPricing';
import usePortfolioTabs from './hooks/usePortfolioTabs';

/**
 * Portföy sayfası — orchestrator.
 *
 * Fiyat hesaplama + tab filtreleme custom hook'lara çıkarıldı:
 *   - usePortfolioPricing: marketData + fundPrices query'leri, getCurrentPrice ve calculateProfitLoss
 *   - usePortfolioTabs:    aktif tab + filteredPortfolio + tabs/counts
 *
 * Sayfa kalan parçaları yönetir: ekle/al/sat/geçmiş modal'ları + render düzeni.
 */
const PortfolioPage = () => {
    const { t } = useTranslation(['portfolio', 'common']);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [buyMoreAsset, setBuyMoreAsset] = useState(null);
    const [sellAsset, setSellAsset] = useState(null);
    const [historySymbol, setHistorySymbol] = useState(null);
    const queryClient = useQueryClient();
    const { currency, toggleCurrency } = useCurrency();

    // Bakiye gizleme (göz ikonu) — localStorage'da kalıcı
    const [hideBalances, setHideBalances] = useState(() => localStorage.getItem('hideBalances') === '1');
    const toggleHide = () => setHideBalances(v => {
        const next = !v;
        localStorage.setItem('hideBalances', next ? '1' : '0');
        return next;
    });

    const { data: portfolio, isLoading, error } = useQuery({
        queryKey: ['portfolio'],
        queryFn: portfolioApi.getMyPortfolio
    });

    const { getCurrentPrice, calculateProfitLoss } = usePortfolioPricing(portfolio);
    const { activeTab, setActiveTab, tabsState, filteredPortfolio } = usePortfolioTabs(portfolio);

    const addAssetMutation = useMutation({
        mutationFn: portfolioApi.addManualEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });

    const sellAssetMutation = useMutation({
        mutationFn: portfolioApi.removeFromPortfolio,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text-muted">{t('common:status.loading')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="text-center text-red-500">
                    <p>{t('common:status.error')}</p>
                    <p className="text-sm text-text-muted mt-2">{error.message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg p-4 md:p-6">
            <div className="max-w-container mx-auto">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">{t('portfolio:pageTitle')}</h1>
                        <p className="text-text-muted mt-1 text-sm sm:text-base">{t('portfolio:pageSubtitle')}</p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        {/* Bakiye gizle/göster */}
                        <button
                            onClick={toggleHide}
                            title={hideBalances ? t('portfolio:showBalances', 'Bakiyeleri göster') : t('portfolio:hideBalances', 'Bakiyeleri gizle')}
                            className="w-11 h-11 flex items-center justify-center rounded-lg bg-surface-2 hover:bg-surface-hover border border-border text-text-muted hover:text-text transition"
                        >
                            {hideBalances ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                        {/* TRY / USD */}
                        <button
                            onClick={toggleCurrency}
                            title={t('asset:showInCurrency', 'Para birimi')}
                            className="h-11 px-3 flex items-center gap-1 rounded-lg bg-surface-2 hover:bg-surface-hover border border-border text-sm font-bold transition"
                        >
                            <span className={currency === 'TRY' ? 'text-primary' : 'text-text-muted'}>₺</span>
                            <span className="text-text-muted">/</span>
                            <span className={currency === 'USD' ? 'text-primary' : 'text-text-muted'}>$</span>
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-primary hover:bg-primary-hover rounded font-semibold transition"
                        >
                            + {t('common:actions.add')}
                        </button>
                    </div>
                </div>

                {portfolio && portfolio.length > 0 && tabsState.tabs.length > 1 && (
                    <PortfolioTabs
                        tabs={tabsState.tabs}
                        counts={tabsState.counts}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                    />
                )}

                <PortfolioStats
                    portfolio={filteredPortfolio}
                    calculateProfitLoss={calculateProfitLoss}
                    hidden={hideBalances}
                />

                {filteredPortfolio && filteredPortfolio.length > 0 && (
                    <div className={hideBalances ? 'blur-md select-none pointer-events-none transition' : 'transition'}>
                        <PortfolioCharts
                            portfolio={filteredPortfolio}
                            calculateProfitLoss={calculateProfitLoss}
                            groupBy={activeTab === 'ALL' ? 'assetType' : 'symbol'}
                            parentAssetType={activeTab === 'ALL' ? null : activeTab}
                        />
                    </div>
                )}

                <HoldingsTable
                    portfolio={filteredPortfolio}
                    calculateProfitLoss={calculateProfitLoss}
                    hidden={hideBalances}
                    onOpenHistory={setHistorySymbol}
                    onOpenBuy={setBuyMoreAsset}
                    onOpenSell={setSellAsset}
                />
            </div>

            <AddToPortfolioModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={(data) => addAssetMutation.mutateAsync(data)}
            />

            <BuyMoreModal
                isOpen={!!buyMoreAsset}
                onClose={() => setBuyMoreAsset(null)}
                onSubmit={(data) => addAssetMutation.mutateAsync(data)}
                asset={buyMoreAsset}
                currentPrice={buyMoreAsset ? getCurrentPrice(buyMoreAsset.symbol, buyMoreAsset.assetType) : null}
            />

            <SellModal
                isOpen={!!sellAsset}
                onClose={() => setSellAsset(null)}
                onSubmit={(data) => sellAssetMutation.mutateAsync(data)}
                asset={sellAsset}
                currentPrice={sellAsset ? getCurrentPrice(sellAsset.symbol, sellAsset.assetType) : null}
            />

            <TransactionHistoryModal
                isOpen={!!historySymbol}
                onClose={() => setHistorySymbol(null)}
                symbol={historySymbol}
            />
        </div>
    );
};

export default PortfolioPage;
