import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../config/apiClient';

const AddToPortfolioModal = ({ isOpen, onClose, onSubmit }) => {
    const [step, setStep] = useState(1); // 1: Tür seç, 2: Varlık seç, 3: Detaylar
    const [selectedType, setSelectedType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [averagePrice, setAveragePrice] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingPrice, setFetchingPrice] = useState(false);

    const assetTypes = [
        { value: 'STOCK', label: 'Hisse Senedi', endpoint: '/market-data/stocks' },
        { value: 'CRYPTO', label: 'Kripto Para', endpoint: '/market-data/crypto-currencies' },
        { value: 'CURRENCY', label: 'Döviz', endpoint: '/market-data/currencies' },
        { value: 'COMMODITY', label: 'Emtia', endpoint: '/market-data/commodities' },
        { value: 'BOND', label: 'Tahvil', endpoint: '/market-data/bonds' },
        { value: 'FUND', label: 'Fon', endpoint: '/market-data/tr-funds' }
    ];

    // Seçilen türe göre varlıkları çek
    const { data: assets, isLoading: assetsLoading } = useQuery({
        queryKey: ['assets', selectedType],
        queryFn: async () => {
            if (!selectedType) return [];

            const typeConfig = assetTypes.find(t => t.value === selectedType);
            if (!typeConfig) return [];

            const response = await apiClient.get(typeConfig.endpoint);
            return response;
        },
        enabled: !!selectedType
    });

    // Arama filtresi
    const filteredAssets = assets?.filter(asset => {
        const searchLower = searchTerm.toLowerCase();
        const symbol = asset.symbol?.toLowerCase() || '';
        const name = asset.name?.toLowerCase() || '';
        const currencyCode = asset.currencyCode?.toLowerCase() || '';

        return symbol.includes(searchLower) ||
            name.includes(searchLower) ||
            currencyCode.includes(searchLower);
    }) || [];

    const handleTypeSelect = (type) => {
        setSelectedType(type);
        setStep(2);
        setSearchTerm('');
        setSelectedAsset(null);
    };

    const handleAssetSelect = async (asset) => {
        console.log('🔵 FON SEÇİLDİ, asset:', asset);
        console.log('🔵 selectedType:', selectedType);

        // 🚀 Eğer FON ise, önce fiyatı çek, sonra STEP 3'e geç
        if (selectedType === 'FUND') {
            setFetchingPrice(true);
            console.log('🔵 Fiyat çekiliyor...');

            try {
                const symbol = asset.symbol || asset.currencyCode;
                console.log('🔵 Symbol:', symbol);
                console.log('🔵 API URL:', `/market-data/historical/${symbol}?range=1d&interval=1d`);

                const chartData = await apiClient.get('/market-data/historical', {
                    params: {
                        symbol: symbol,
                        range: '1d',
                        interval: '1d'
                    }
                });

                console.log('🔵 Chart Data:', chartData);

                if (chartData && chartData.length > 0) {
                    const lastPrice = chartData[chartData.length - 1].price;
                    console.log('✅ Fiyat bulundu:', lastPrice);
                    // Asset objesine güncel fiyatı ekle
                    asset.currentPrice = lastPrice;
                } else {
                    console.warn('⚠️ Chart data boş veya yok');
                }
            } catch (error) {
                console.error('❌ Fon fiyatı çekilemedi:', error);
                asset.currentPrice = 0;
            } finally {
                setFetchingPrice(false);
            }
        }

        console.log('🔵 Final asset:', asset);
        setSelectedAsset({...asset});
        setStep(3);
        setAveragePrice('');
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onSubmit({
                symbol: selectedAsset.symbol || selectedAsset.currencyCode,
                assetType: selectedType,
                quantity: parseFloat(quantity),
                averagePrice: parseFloat(averagePrice)
            });

            // Reset
            setStep(1);
            setSelectedType('');
            setSearchTerm('');
            setSelectedAsset(null);
            setQuantity('');
            setAveragePrice('');

            onClose();
        } catch (error) {
            console.error('Portföye ekleme hatası:', error);
            alert('Hata: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 3) {
            setStep(2);
            setSelectedAsset(null);
        } else if (step === 2) {
            setStep(1);
            setSelectedType('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1d29] rounded-lg w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#868993] hover:text-white z-10"
                >
                    <X size={24} />
                </button>

                <div className="p-6">
                    {/* Header */}
                    <h2 className="text-2xl font-bold mb-6">Portföye Varlık Ekle</h2>

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center mb-8">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-[#2962ff]' : 'bg-[#2a2e39]'}`}>1</div>
                        <div className={`w-16 h-1 ${step >= 2 ? 'bg-[#2962ff]' : 'bg-[#2a2e39]'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-[#2962ff]' : 'bg-[#2a2e39]'}`}>2</div>
                        <div className={`w-16 h-1 ${step >= 3 ? 'bg-[#2962ff]' : 'bg-[#2a2e39]'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-[#2962ff]' : 'bg-[#2a2e39]'}`}>3</div>
                    </div>

                    {/* STEP 1: Varlık Türü Seç */}
                    {step === 1 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Varlık Türünü Seçin</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {assetTypes.map(type => (
                                    <button
                                        key={type.value}
                                        onClick={() => handleTypeSelect(type.value)}
                                        className="p-4 bg-[#0d0f15] hover:bg-[#2a2e39] border border-[#2a2e39] hover:border-[#2962ff] rounded-lg transition text-left"
                                    >
                                        <div className="font-semibold">{type.label}</div>
                                        <div className="text-sm text-[#868993] mt-1">{type.value}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Varlık Ara ve Seç */}
                    {step === 2 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                {assetTypes.find(t => t.value === selectedType)?.label} Seçin
                            </h3>

                            {/* Arama Kutusu */}
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#868993]" size={20} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Ara... (Sembol veya isim)"
                                    className="w-full bg-[#0d0f15] border border-[#2a2e39] rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-[#2962ff]"
                                    autoFocus
                                />
                            </div>

                            {/* Varlık Listesi */}
                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {fetchingPrice && (
                                    <div className="mb-4 p-3 bg-[#2962ff]/10 border border-[#2962ff]/30 rounded-lg text-center text-[#2962ff] text-sm">
                                        ⏳ Güncel fiyat çekiliyor...
                                    </div>
                                )}
                                {assetsLoading ? (
                                    <div className="text-center py-8 text-[#868993]">Yükleniyor...</div>

                                ) : filteredAssets.length === 0 ? (
                                    <div className="text-center py-8 text-[#868993]">Varlık bulunamadı</div>
                                ) : (
                                    filteredAssets.map((asset, idx) => {
                                        const symbol = asset.symbol || asset.currencyCode;
                                        const name = asset.name || asset.currencyName;

                                        // 🔧 Fiyat bilgisini al
                                        const price = asset.price || asset.forexSelling || asset.value || asset.lastPrice || asset.unitPrice || 0;
                                        const hasPriceData = price > 0;

                                        // FON için fiyat gösterme (chart API'sinden çekilecek)
                                        const isFund = selectedType === 'FUND';

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleAssetSelect(asset)}
                                                disabled={fetchingPrice}
                                                className="w-full p-3 bg-[#0d0f15] hover:bg-[#2a2e39] border border-[#2a2e39] hover:border-[#2962ff] rounded-lg transition text-left flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                            >

                                            <div className="flex-1">
                                                    <div className="font-semibold">{symbol}</div>
                                                    <div className="text-sm text-[#868993]">{name}</div>
                                                </div>
                                                <div className="text-right">
                                                    {isFund ? (
                                                        <div className="text-xs text-[#2962ff]">Seç →</div>
                                                    ) : hasPriceData ? (
                                                        <div className="font-semibold">{price.toFixed(2)} ₺</div>
                                                    ) : (
                                                        <div className="text-xs text-[#868993]">-</div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })

                                )}
                            </div>

                            <button
                                onClick={handleBack}
                                className="mt-4 w-full px-4 py-2 bg-[#2a2e39] hover:bg-[#3a3e49] rounded font-semibold transition"
                            >
                                ← Geri
                            </button>
                        </div>
                    )}

                    {/* STEP 3: Miktar ve Fiyat Gir */}
                    {step === 3 && selectedAsset && (
                        <form onSubmit={handleSubmit}>
                            <h3 className="text-lg font-semibold mb-4">Detayları Girin</h3>

                            {/* Seçilen Varlık Özeti */}
                            <div className="bg-[#0d0f15] border border-[#2a2e39] rounded-lg p-4 mb-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-semibold text-lg">{selectedAsset.symbol || selectedAsset.currencyCode}</div>
                                        <div className="text-sm text-[#868993]">{selectedAsset.name || selectedAsset.currencyName}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-[#868993]">Güncel Fiyat</div>
                                        {(() => {
                                            const currentPrice = selectedAsset.currentPrice || selectedAsset.price || selectedAsset.forexSelling || selectedAsset.value || selectedAsset.lastPrice || selectedAsset.unitPrice || 0;
                                            return currentPrice > 0 ? (
                                                <div className="font-semibold">{currentPrice.toFixed(2)} ₺</div>
                                            ) : (
                                                <div className="text-sm text-[#868993]">Bilgi yok</div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Miktar */}
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Miktar</label>
                                <input
                                    type="number"
                                    step="0.00000001"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="Örn: 100"
                                    className="w-full bg-[#0d0f15] border border-[#2a2e39] rounded-lg px-4 py-3 focus:outline-none focus:border-[#2962ff]"
                                    required
                                    autoFocus
                                />
                            </div>

                            {/* Ortalama Alış Fiyatı */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold mb-2">
                                    Ortalama Alış Fiyatı
                                    {(() => {
                                        const currentPrice = selectedAsset.currentPrice || selectedAsset.price || selectedAsset.forexSelling || selectedAsset.value || selectedAsset.lastPrice || selectedAsset.unitPrice || 0;
                                        return currentPrice > 0 ? (
                                            <span className="text-[#868993] font-normal ml-2">
                                                (Güncel: {currentPrice.toFixed(2)} ₺)
                                            </span>
                                        ) : null;
                                    })()}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={averagePrice}
                                    onChange={(e) => setAveragePrice(e.target.value)}
                                    placeholder="Örn: 45.50"
                                    className="w-full bg-[#0d0f15] border border-[#2a2e39] rounded-lg px-4 py-3 focus:outline-none focus:border-[#2962ff]"
                                    required
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="flex-1 px-4 py-3 bg-[#2a2e39] hover:bg-[#3a3e49] rounded-lg font-semibold transition"
                                >
                                    ← Geri
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-3 bg-[#2962ff] hover:bg-[#1e4db7] rounded-lg font-semibold transition disabled:opacity-50"
                                >
                                    {loading ? 'Ekleniyor...' : 'Portföye Ekle'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddToPortfolioModal;
