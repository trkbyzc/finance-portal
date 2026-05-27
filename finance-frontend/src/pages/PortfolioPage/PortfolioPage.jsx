import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Plus, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { portfolioApi } from '../../services/api/portfolioApi';
import { apiClient } from '../../config/apiClient';
import AddToPortfolioModal from '../../components/portfolio/AddToPortfolioModal';
import BuyMoreModal from '../../components/portfolio/BuyMoreModal';
import SellModal from '../../components/portfolio/SellModal';
import PortfolioStats from '../../components/portfolio/PortfolioStats';
import PortfolioCharts from '../../components/portfolio/PortfolioCharts';
import TransactionHistoryModal from '../../components/portfolio/TransactionHistoryModal';
import { useCurrency } from '../../context/CurrencyContext';

/**
 * Holding'in doğal para birimi — formatPrice convert yapsın diye.
 * Backend AssetType enum'unda GOLD/BOND_TR yok (UI ayrımı), bu yüzden mapping
 * sadece backend enum'una göre yapılır:
 *   STOCK .IS → TRY ; STOCK foreign → USD
 *   CRYPTO / COMMODITY / BOND → USD
 *   CURRENCY / FUND → TRY
 */
function nativeCurrencyOf(item) {
    const type = item.assetType;
    const sym = (item.symbol || '').toUpperCase();
    switch (type) {
        case 'STOCK':     return sym.endsWith('.IS') ? 'TRY' : 'USD';
        case 'CRYPTO':    return 'USD';
        case 'COMMODITY': return 'USD';
        case 'BOND':      return 'USD';
        default:          return 'TRY';
    }
}

const PortfolioPage = () => {
    const { t } = useTranslation(['portfolio', 'common']);
    const { formatPrice } = useCurrency();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [buyMoreAsset, setBuyMoreAsset] = useState(null);
    const [sellAsset, setSellAsset] = useState(null);
    const [historySymbol, setHistorySymbol] = useState(null);
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

                <PortfolioStats
                    portfolio={portfolio}
                    calculateProfitLoss={calculateProfitLoss}
                />

                {portfolio && portfolio.length > 0 && (
                    <PortfolioCharts
                        portfolio={portfolio}
                        calculateProfitLoss={calculateProfitLoss}
                    />
                )}

                {!portfolio || portfolio.length === 0 ? (
                    <div className="bg-surface-2 rounded-lg p-12 text-center">
                        <p className="text-text-muted text-lg mb-4">{t('portfolio:holdings.noHoldings')}</p>
                        <p className="text-text-muted text-sm">{t('portfolio:holdings.addFirst')}</p>
                    </div>
                ) : (
                    <div className="bg-surface-2 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-bg border-b border-border">
                            <tr>
                                <th className="text-left p-4 text-text-muted font-semibold">{t('portfolio:holdings.cols.asset')}</th>
                                <th className="text-left p-4 text-text-muted font-semibold">{t('common:labels.type')}</th>
                                <th className="text-right p-4 text-text-muted font-semibold">{t('portfolio:holdings.cols.quantity')}</th>
                                <th className="text-right p-4 text-text-muted font-semibold">{t('portfolio:holdings.cols.avgPrice')}</th>
                                <th className="text-right p-4 text-text-muted font-semibold">{t('portfolio:holdings.cols.currentPrice')}</th>
                                <th className="text-right p-4 text-text-muted font-semibold">{t('portfolio:holdings.cols.totalValue')}</th>
                                <th className="text-right p-4 text-text-muted font-semibold">{t('portfolio:holdings.cols.pnl')}</th>
                                <th className="text-center p-4 text-text-muted font-semibold">{t('portfolio:holdings.cols.actions')}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {portfolio.map((item, idx) => {
                                const calc = calculateProfitLoss(item);
                                return (
                                    <tr key={idx} className="border-b border-border hover:bg-bg transition">
                                        <td className="p-4 font-semibold">{item.symbol}</td>
                                        <td className="p-4 text-text-muted">{t('common:assetTypes.' + item.assetType, item.assetType)}</td>
                                        <td className="p-4 text-right">{item.quantity}</td>
                                        {(() => {
                                            const native = nativeCurrencyOf(item);
                                            return (<>
                                                <td className="p-4 text-right">{formatPrice(item.averagePrice, native)}</td>
                                                <td className="p-4 text-right">{formatPrice(calc.currentPrice, native)}</td>
                                                <td className="p-4 text-right font-semibold">{formatPrice(calc.currentValue, native)}</td>
                                                <td className={`p-4 text-right font-semibold ${calc.profitLoss >= 0 ? 'text-buy' : 'text-sell'}`}>
                                                    {calc.profitLoss >= 0 ? '+' : '-'}{formatPrice(Math.abs(calc.profitLoss), native)}
                                                    <span className="text-sm ml-1">({calc.profitLossPercent >= 0 ? '+' : ''}{calc.profitLossPercent.toFixed(2)}%)</span>
                                                </td>
                                            </>);
                                        })()}
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setHistorySymbol(item.symbol)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition"
                                                    title={t('portfolio:transactions.openHistory')}
                                                >
                                                    <Clock size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setBuyMoreAsset(item)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-buy hover:bg-buy/10 transition"
                                                    title={t('portfolio:trade.buy')}
                                                >
                                                    <Plus size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setSellAsset(item)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-sell hover:bg-sell/10 transition"
                                                    title={t('portfolio:trade.sell')}
                                                >
                                                    <Minus size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
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
