import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, X } from 'lucide-react'; // 🚀 X ikonunu ekledik
import { useAssetDetails } from '../../hooks/useAssetDetails';
import { portfolioApi } from '../../services/api/portfolioApi'; // 🚀 API servisi
import Modal from '../../components/layout/Modal'; // 🚀 Bildirimler için mevcut Modalı içeri aldık

import AssetHeader from './components/AssetHeader';
import AssetChartArea from './components/AssetChartArea';
import BondDetailView from './components/BondDetailView';
import ComparisonSection from './components/ComparisonSection';

export default function AssetDetailPage() {
    const { symbol } = useParams();
    const navigate = useNavigate();

    const { asset, trBondsList, loading, isTrBond, isViop, decodedSymbol } = useAssetDetails(symbol);

    // 🚀 MODAL STATE'LERİ
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({ quantity: '', price: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 🚀 BİLDİRİM MODALI STATE'İ (Mevcut Modal.jsx kullanılacak)
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-[#0b0e14]">
            <Loader2 className="animate-spin text-[#2962ff]" size={48} />
        </div>
    );

    if (isTrBond && asset) {
        return <BondDetailView asset={asset} trBondsList={trBondsList} decodedSymbol={decodedSymbol} navigate={navigate} />;
    }

    // 🚀 BUTONA BASILINCA FORM MODALINI AÇAR VE FİYATI DOLDURUR
    const handleOpenModal = () => {
        setFormData({
            quantity: '1',
            price: asset?.displayPrice || ''
        });
        setIsAddModalOpen(true);
    };

    // 🚀 BACKEND'E VERİYİ POSTLAR
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // portfolioApi.js send'inde averagePrice parametresi backend'in price alanına gidiyor
            const payload = {
                symbol: asset?.symbol || decodedSymbol,
                assetType: asset?.assetCategory || 'STOCK',
                quantity: parseFloat(formData.quantity),
                averagePrice: parseFloat(formData.price)
            };

            await portfolioApi.addManualEntry(payload);

            setIsAddModalOpen(false); // Formu Kapat

            // Başarılı Bildirimi Çıkar
            setAlertModal({
                isOpen: true,
                title: 'Başarılı!',
                message: `${payload.quantity} adet ${payload.symbol} başarıyla portföyünüze eklendi.`,
                type: 'success'
            });

        } catch (error) {
            console.error("Portföy ekleme hatası:", error);
            setAlertModal({
                isOpen: true,
                title: 'Hata!',
                message: error.response?.data?.message || 'Varlık portföye eklenirken bir sorun oluştu.',
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0b0e14] text-white p-6 lg:p-10 relative">
            {/* 1. Üst Başlık (Portföy Butonunu Tetikleyen Prop Geçildi) */}
            <AssetHeader asset={asset} navigate={navigate} onAddPortfolioClick={handleOpenModal} />

            {/* 2. Dinamik Grafik Alanı */}
            <AssetChartArea asset={asset} isViop={isViop} />

            {/* 3. Kıyaslama Bölümü */}
            <ComparisonSection asset={asset} baseSymbol={asset?.yahooSymbol || asset?.symbol} />

            {/* 🚀 4. PORTFÖYE EKLE (FORM) MODALI */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-[#2a2e39]">
                            <h3 className="text-xl font-bold text-white">Portföye Ekle</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-[#868993] hover:text-white transition">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">

                            <div className="bg-[#1e222d] p-3 rounded-xl border border-[#2a2e39] flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#2962ff]/20 flex items-center justify-center text-[#2962ff] font-bold">
                                    {asset?.symbol?.substring(0,2) || 'XX'}
                                </div>
                                <div>
                                    <div className="text-white font-bold tracking-wider">{asset?.symbol || decodedSymbol}</div>
                                    <div className="text-[#868993] text-xs">Varlık Kodu</div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[#868993] text-sm mb-1.5 font-medium">Miktar / Adet</label>
                                <input
                                    type="number"
                                    step="any"
                                    required
                                    min="0.000001"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                                    className="w-full bg-[#1e222d] border border-[#2a2e39] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#2962ff] transition"
                                    placeholder="Örn: 10.5"
                                />
                            </div>

                            <div>
                                <label className="block text-[#868993] text-sm mb-1.5 font-medium">Alış Fiyatı (Birim Başına)</label>
                                <input
                                    type="number"
                                    step="any"
                                    required
                                    min="0.000001"
                                    value={formData.price}
                                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                                    className="w-full bg-[#1e222d] border border-[#2a2e39] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#2962ff] transition"
                                    placeholder="Örn: 150.25"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="mt-2 w-full bg-[#2962ff] hover:bg-[#2962ff]/90 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex justify-center items-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Portföye Kaydet'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 🚀 5. BİLDİRİM MODALI (Geri dönüşleri göstermek için) */}
            <Modal
                isOpen={alertModal.isOpen}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
            />
        </div>
    );
}