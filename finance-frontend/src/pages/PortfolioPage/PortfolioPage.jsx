import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Edit2 } from 'lucide-react';
import { portfolioApi } from '../../services/api/portfolioApi';
import { apiClient } from '../../config/apiClient';
import AddToPortfolioModal from '../../components/portfolio/AddToPortfolioModal';
import EditPortfolioModal from '../../components/portfolio/EditPortfolioModal';
import PortfolioStats from '../../components/portfolio/PortfolioStats';
import PortfolioCharts from '../../components/portfolio/PortfolioCharts';

const PortfolioPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const queryClient = useQueryClient();

    // Portföyü çek
    const { data: portfolio, isLoading, error } = useQuery({
        queryKey: ['portfolio'],
        queryFn: portfolioApi.getMyPortfolio
    });

    // 🚀 YENİ: Tüm piyasa verilerini çek (güncel fiyatlar için)
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
        staleTime: 30000 // 30 saniye cache
    });

    // 🚀 Fonlar için güncel fiyatları çek
    const { data: fundPrices } = useQuery({
        queryKey: ['fundPrices', portfolio],
        queryFn: async () => {
            if (!portfolio) return {};

            const funds = portfolio.filter(item => item.assetType === 'FUND');
            if (funds.length === 0) return {};

            const pricePromises = funds.map(async (fund) => {
                try {
                    const chartData = await apiClient.get('/market-data/historical', {
                        params: {
                            symbol: fund.symbol,
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
                    console.warn(`Fon fiyatı çekilemedi: ${fund.symbol}`, error);
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

    // Varlık ekleme mutation
    const addAssetMutation = useMutation({
        mutationFn: portfolioApi.addManualEntry,
        onSuccess: () => {
            queryClient.invalidateQueries(['portfolio']);
            alert('✅ Varlık başarıyla portföye eklendi!');
        }
    });

    // Varlık silme mutation
    const deleteAssetMutation = useMutation({
        mutationFn: portfolioApi.removeFromPortfolio,
        onSuccess: () => {
            queryClient.invalidateQueries(['portfolio']);
            alert('✅ Varlık portföyden çıkarıldı!');
        }
    });

    const editAssetMutation = useMutation({
        mutationFn: portfolioApi.updateManualEntry,
        onSuccess: () => {
            queryClient.invalidateQueries(['portfolio']);
            alert('✅ Varlık başarıyla güncellendi!');
        }
    });

    const handleAddAsset = async (data) => {
        await addAssetMutation.mutateAsync(data);
    };

    const handleDeleteAsset = async (item) => {
        if (!confirm(`${item.symbol} sembolünü portföyden çıkarmak istediğinize emin misiniz?`)) {
            return;
        }

        await deleteAssetMutation.mutateAsync({
            symbol: item.symbol,
            assetType: item.assetType,
            quantity: item.quantity
        });
    };

    // 🆕 Düzenleme handler'ı
    const handleEditAsset = (item) => {
        setEditingAsset(item);
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (data) => {
        await editAssetMutation.mutateAsync(data);
    };

    // 🚀 YENİ: Frontend'te güncel fiyat bul
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
                    // 🚀 Fonlar için ayrı çekilen fiyatları kullan
                    return fundPrices?.[symbol] || null;

                default:
                    return null;
            }
        } catch (e) {
            return null;
        }
    };

    // Kar/Zarar hesaplama (frontend'te güncel fiyatla)
    const calculateProfitLoss = (item) => {
        // Frontend'ten güncel fiyat al
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
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2962ff] mx-auto mb-4"></div>
                    <p className="text-[#868993]">Portföy yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-center text-red-500">
                    <p>❌ Portföy yüklenirken hata oluştu</p>
                    <p className="text-sm text-[#868993] mt-2">{error.message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Portföyüm</h1>
                        <p className="text-[#868993] mt-1">Varlıklarınızı takip edin</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-[#2962ff] hover:bg-[#1e4db7] rounded font-semibold transition"
                    >
                        + Varlık Ekle
                    </button>
                </div>

                {/* Özet İstatistikler */}
                <PortfolioStats
                    portfolio={portfolio}
                    calculateProfitLoss={calculateProfitLoss}
                />

                {/* Grafikler */}
                {portfolio && portfolio.length > 0 && (
                    <PortfolioCharts
                        portfolio={portfolio}
                        calculateProfitLoss={calculateProfitLoss}
                    />
                )}

                {/* Varlık Listesi */}
                {!portfolio || portfolio.length === 0 ? (
                    <div className="bg-[#1a1d29] rounded-lg p-12 text-center">
                        <p className="text-[#868993] text-lg mb-4">📊 Henüz portföyünüzde varlık bulunmuyor</p>
                        <p className="text-[#868993] text-sm">Varlık eklemek için yukarıdaki butona tıklayın</p>
                    </div>
                ) : (
                    <div className="bg-[#1a1d29] rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-[#0d0f15] border-b border-[#2a2e39]">
                            <tr>
                                <th className="text-left p-4 text-[#868993] font-semibold">Sembol</th>
                                <th className="text-left p-4 text-[#868993] font-semibold">Tür</th>
                                <th className="text-right p-4 text-[#868993] font-semibold">Miktar</th>
                                <th className="text-right p-4 text-[#868993] font-semibold">Ort. Alış</th>
                                <th className="text-right p-4 text-[#868993] font-semibold">Güncel Fiyat</th>
                                <th className="text-right p-4 text-[#868993] font-semibold">Güncel Değer</th>
                                <th className="text-right p-4 text-[#868993] font-semibold">Kar/Zarar</th>
                                <th className="text-center p-4 text-[#868993] font-semibold">İşlem</th>
                            </tr>
                            </thead>
                            <tbody>
                            {portfolio.map((item, idx) => {
                                const calc = calculateProfitLoss(item);
                                return (
                                    <tr key={idx} className="border-b border-[#2a2e39] hover:bg-[#0d0f15] transition">
                                        <td className="p-4 font-semibold">{item.symbol}</td>
                                        <td className="p-4 text-[#868993]">{item.assetType}</td>
                                        <td className="p-4 text-right">{item.quantity}</td>
                                        <td className="p-4 text-right">{item.averagePrice.toFixed(2)} ₺</td>
                                        <td className="p-4 text-right">{calc.currentPrice.toFixed(2)} ₺</td>
                                        <td className="p-4 text-right font-semibold">{calc.currentValue.toFixed(2)} ₺</td>
                                        <td className={`p-4 text-right font-semibold ${calc.profitLoss >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                                            {calc.profitLoss >= 0 ? '+' : ''}{calc.profitLoss.toFixed(2)} ₺
                                            <span className="text-sm ml-1">({calc.profitLossPercent >= 0 ? '+' : ''}{calc.profitLossPercent.toFixed(2)}%)</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEditAsset(item)}
                                                    className="text-blue-500 hover:text-blue-400 transition"
                                                    title="Düzenle"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAsset(item)}
                                                    className="text-red-500 hover:text-red-400 transition"
                                                    title="Portföyden Çıkar"
                                                >
                                                    <Trash2 size={18} />
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

            {/* Ekleme Modalı */}
            <AddToPortfolioModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddAsset}
            />

            {/* Düzenleme Modalı */}
            <EditPortfolioModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingAsset(null);
                }}
                onSubmit={handleEditSubmit}
                asset={editingAsset}
            />
        </div>
    );
};

export default PortfolioPage;
