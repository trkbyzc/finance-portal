import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { portfolioApi } from '../../services/api/portfolioApi';
import { apiClient } from '../../config/apiClient';
import AddToPortfolioModal from '../../components/portfolio/AddToPortfolioModal';
import BuyMoreModal from '../../components/portfolio/BuyMoreModal';
import SellModal from '../../components/portfolio/SellModal';
import PortfolioStats from '../../components/portfolio/PortfolioStats';
import PortfolioCharts from '../../components/portfolio/PortfolioCharts';
import PortfolioTabs from '../../components/portfolio/PortfolioTabs';
import TransactionHistoryModal from '../../components/portfolio/TransactionHistoryModal';
import HoldingsTable from '../../components/portfolio/HoldingsTable';

/** Tab sırası — sadece kullanıcının elinde bulunan tipler görünür, "Tümü" her zaman ilk. */
const ASSET_TYPE_ORDER = ['STOCK', 'CRYPTO', 'CURRENCY', 'COMMODITY', 'BOND', 'FUND', 'FUTURE'];

const PortfolioPage = () => {
    const { t } = useTranslation(['portfolio', 'common']);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [buyMoreAsset, setBuyMoreAsset] = useState(null);
    const [sellAsset, setSellAsset] = useState(null);
    const [historySymbol, setHistorySymbol] = useState(null);
    const [activeTab, setActiveTab] = useState('ALL');
    const queryClient = useQueryClient();

    const { data: portfolio, isLoading, error } = useQuery({
        queryKey: ['portfolio'],
        queryFn: portfolioApi.getMyPortfolio
    });

    const { data: marketData } = useQuery({
        queryKey: ['allMarketData'],
        queryFn: async () => {
            const [stocks, cryptos, currencies, commodities, bonds, funds] = await Promise.all([
                apiClient.get('/market-data/stocks').catch(() => []),
                apiClient.get('/market-data/crypto-currencies').catch(() => []),
                apiClient.get('/market-data/currencies').catch(() => []),
                apiClient.get('/market-data/commodities').catch(() => []),
                apiClient.get('/market-data/bonds').catch(() => []),
                apiClient.get('/market-data/tr-funds').catch(() => [])
            ]);

            return { stocks, cryptos, currencies, commodities, bonds, funds };
        },
        staleTime: 30000
    });

    const { data: fundPrices } = useQuery({
        queryKey: ['fundPrices', portfolio],
        queryFn: async () => {
            if (!portfolio) return {};

            const funds = portfolio.filter(item => item.assetType === 'FUND');
            if (funds.length === 0) return {};

            const pricePromises = funds.map(async (fund) => {
                try {
                    // FundChartStrategy sadece category=TR_FUND ile match eder; param'siz çağrı
                    // strategy chain'in tepesinden Yahoo'ya düşüp 404 alır → fiyat boş gelir.
                    const chartData = await apiClient.get('/market-data/historical', {
                        params: {
                            symbol: fund.symbol,
                            category: 'TR_FUND',
                            range: '1d',
                            interval: '1d'
                        }
                    });

                    if (chartData && chartData.length > 0) {
                        return {
                            symbol: fund.symbol,
                            price: chartData[chartData.length - 1].price
                        };
                    }
                } catch (error) {
                    console.warn(`Fund price fetch failed: ${fund.symbol}`, error);
                }
                return { symbol: fund.symbol, price: 0 };
            });

            const prices = await Promise.all(pricePromises);
            return prices.reduce((acc, item) => {
                acc[item.symbol] = item.price;
                return acc;
            }, {});
        },
        enabled: !!portfolio && portfolio.some(item => item.assetType === 'FUND'),
        staleTime: 30000
    });

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

    const handleAddAsset = async (data) => {
        await addAssetMutation.mutateAsync(data);
    };

    const handleBuyMore = async (data) => {
        await addAssetMutation.mutateAsync(data);
    };

    const handleSell = async (data) => {
        await sellAssetMutation.mutateAsync(data);
    };

    const getCurrentPrice = (symbol, assetType) => {
        if (!marketData) return null;

        try {
            switch (assetType) {
                case 'STOCK':
                    const stock = marketData.stocks?.find(s => s.symbol === symbol);
                    return stock?.price;

                case 'CRYPTO':
                    const crypto = marketData.cryptos?.find(c => c.currencyCode === symbol);
                    return crypto?.forexSelling;

                case 'CURRENCY':
                    const currency = marketData.currencies?.find(c => c.currencyCode === symbol);
                    return currency?.forexSelling;

                case 'COMMODITY':
                    const commodity = marketData.commodities?.find(c => c.symbol === symbol);
                    return commodity?.price;

                case 'BOND':
                    const bond = marketData.bonds?.find(b => b.symbol === symbol);
                    return bond?.price;

                case 'FUND':
                    return fundPrices?.[symbol] || null;

                default:
                    return null;
            }
        } catch (e) {
            return null;
        }
    };

    const calculateProfitLoss = (item) => {
        const currentPrice = getCurrentPrice(item.symbol, item.assetType) || item.currentPrice;

        const profitLoss = (currentPrice - item.averagePrice) * item.quantity;
        const profitLossPercent = ((currentPrice - item.averagePrice) / item.averagePrice) * 100;

        return {
            currentPrice,
            profitLoss,
            profitLossPercent,
            currentValue: currentPrice * item.quantity
        };
    };

    // Mevcut asset tipleri + her tipin sayısı — boş tab göstermeyiz.
    const tabsState = useMemo(() => {
        const counts = { ALL: portfolio?.length || 0 };
        ASSET_TYPE_ORDER.forEach(t => { counts[t] = 0; });
        (portfolio || []).forEach(item => {
            if (counts[item.assetType] !== undefined) counts[item.assetType]++;
        });
        const presentTypes = ASSET_TYPE_ORDER.filter(t => counts[t] > 0);
        const tabs = ['ALL', ...presentTypes];
        return { tabs, counts };
    }, [portfolio]);

    // Aktif tab boşalırsa otomatik Tümü'ne dön (örn. son STOCK satıldı, kullanıcı STOCK tab'ında kaldı)
    useEffect(() => {
        if (activeTab !== 'ALL' && tabsState.counts[activeTab] === 0) {
            setActiveTab('ALL');
        }
    }, [tabsState.counts, activeTab]);

    const filteredPortfolio = useMemo(() => {
        if (activeTab === 'ALL') return portfolio || [];
        return (portfolio || []).filter(item => item.assetType === activeTab);
    }, [portfolio, activeTab]);

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
        <div className="min-h-screen bg-bg p-6">
            <div className="max-w-container mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">{t('portfolio:pageTitle')}</h1>
                        <p className="text-text-muted mt-1">{t('portfolio:pageSubtitle')}</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-primary hover:bg-primary-hover rounded font-semibold transition"
                    >
                        + {t('common:actions.add')}
                    </button>
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
                />

                {filteredPortfolio && filteredPortfolio.length > 0 && (
                    <PortfolioCharts
                        portfolio={filteredPortfolio}
                        calculateProfitLoss={calculateProfitLoss}
                        groupBy={activeTab === 'ALL' ? 'assetType' : 'symbol'}
                        parentAssetType={activeTab === 'ALL' ? null : activeTab}
                    />
                )}

                <HoldingsTable
                    portfolio={filteredPortfolio}
                    calculateProfitLoss={calculateProfitLoss}
                    onOpenHistory={setHistorySymbol}
                    onOpenBuy={setBuyMoreAsset}
                    onOpenSell={setSellAsset}
                />
            </div>

            <AddToPortfolioModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddAsset}
            />

            <BuyMoreModal
                isOpen={!!buyMoreAsset}
                onClose={() => setBuyMoreAsset(null)}
                onSubmit={handleBuyMore}
                asset={buyMoreAsset}
                currentPrice={buyMoreAsset ? getCurrentPrice(buyMoreAsset.symbol, buyMoreAsset.assetType) : null}
            />

            <SellModal
                isOpen={!!sellAsset}
                onClose={() => setSellAsset(null)}
                onSubmit={handleSell}
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
