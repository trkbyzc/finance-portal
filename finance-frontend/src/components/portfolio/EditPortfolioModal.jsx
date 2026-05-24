import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const EditPortfolioModal = ({ isOpen, onClose, onSubmit, asset }) => {
    const [quantity, setQuantity] = useState('');
    const [averagePrice, setAveragePrice] = useState('');
    const [loading, setLoading] = useState(false);

    // Modal açıldığında mevcut değerleri doldur
    useEffect(() => {
        if (asset) {
            setQuantity(asset.quantity.toString());
            setAveragePrice(asset.averagePrice.toString());
        }
    }, [asset]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onSubmit({
                symbol: asset.symbol,
                assetType: asset.assetType,
                quantity: parseFloat(quantity),
                averagePrice: parseFloat(averagePrice)
            });

            onClose();
        } catch (error) {
            console.error('Düzenleme hatası:', error);
            alert('Hata: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !asset) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1d29] rounded-lg w-full max-w-md relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#868993] hover:text-white"
                >
                    <X size={24} />
                </button>

                <div className="p-6">
                    {/* Header */}
                    <h2 className="text-2xl font-bold mb-6">Varlık Düzenle</h2>

                    {/* Varlık Bilgisi */}
                    <div className="bg-[#0d0f15] border border-[#2a2e39] rounded-lg p-4 mb-6">
                        <div className="font-semibold text-lg">{asset.symbol}</div>
                        <div className="text-sm text-[#868993]">{asset.assetType}</div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        {/* Miktar */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2">Miktar</label>
                            <input
                                type="number"
                                step="0.00000001"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full bg-[#0d0f15] border border-[#2a2e39] rounded-lg px-4 py-3 focus:outline-none focus:border-[#2962ff]"
                                required
                                autoFocus
                            />
                        </div>

                        {/* Ortalama Alış Fiyatı */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-2">
                                Ortalama Alış Fiyatı (₺)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={averagePrice}
                                onChange={(e) => setAveragePrice(e.target.value)}
                                className="w-full bg-[#0d0f15] border border-[#2a2e39] rounded-lg px-4 py-3 focus:outline-none focus:border-[#2962ff]"
                                required
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 bg-[#2a2e39] hover:bg-[#3a3e49] rounded-lg font-semibold transition"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-[#2962ff] hover:bg-[#1e4db7] rounded-lg font-semibold transition disabled:opacity-50"
                            >
                                {loading ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditPortfolioModal;
