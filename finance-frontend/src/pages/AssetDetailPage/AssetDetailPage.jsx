import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAssetDetails } from '../../hooks/useAssetDetails';
import { portfolioApi } from '../../services/api/portfolioApi';
import Modal from '../../components/layout/Modal';

import AssetHeader from './components/AssetHeader';
import AssetChartArea from './components/AssetChartArea';
import BondDetailView from './components/BondDetailView';
import ComparisonSection from './components/ComparisonSection';

export default function AssetDetailPage() {
    const { symbol } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation(['asset', 'common', 'portfolio']);

    const { asset, trBondsList, loading, isTrBond, isViop, decodedSymbol } = useAssetDetails(symbol);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({ quantity: '', price: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-bg">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );

    if (isTrBond && asset) {
        return <BondDetailView asset={asset} trBondsList={trBondsList} decodedSymbol={decodedSymbol} navigate={navigate} />;
    }

    const handleOpenModal = () => {
        setFormData({
            quantity: '1',
            price: asset?.displayPrice || ''
        });
        setIsAddModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                symbol: asset?.symbol || decodedSymbol,
                assetType: asset?.assetCategory || 'STOCK',
                quantity: parseFloat(formData.quantity),
                averagePrice: parseFloat(formData.price)
            };

            await portfolioApi.addManualEntry(payload);

            setIsAddModalOpen(false);

            setAlertModal({
                isOpen: true,
                title: t('common:actions.confirm'),
                message: t('portfolio:modal.saveSuccess'),
                type: 'success'
            });

        } catch (error) {
            console.error("Add to portfolio error:", error);
            setAlertModal({
                isOpen: true,
                title: t('common:status.error'),
                message: error.response?.data?.message || t('common:status.error'),
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg text-text relative">
            <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
                <AssetHeader asset={asset} navigate={navigate} onAddPortfolioClick={handleOpenModal} />
                <AssetChartArea asset={asset} isViop={isViop} />
                <ComparisonSection asset={asset} baseSymbol={asset?.yahooSymbol || asset?.symbol} />
            </div>

            {isAddModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
                    <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in">
                        <div className="flex justify-between items-center p-5 border-b border-border">
                            <h3 className="text-lg font-bold text-text">{t('asset:addToPortfolio')}</h3>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                            <div className="bg-surface-2 p-3 rounded-xl border border-border flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-black text-sm overflow-hidden">
                                    {asset?.image ? (
                                        <img
                                            src={asset.image}
                                            alt={asset?.symbol}
                                            className="w-full h-full object-contain p-1"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                                e.target.parentNode.textContent = asset?.symbol?.substring(0, 2) || '?';
                                            }}
                                        />
                                    ) : (
                                        asset?.symbol?.substring(0, 2) || '?'
                                    )}
                                </div>
                                <div>
                                    <div className="text-text font-bold tracking-wide">{asset?.symbol || decodedSymbol}</div>
                                    <div className="text-text-muted text-[10px] uppercase tracking-wider font-medium">{t('common:labels.symbol')}</div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-text-muted text-[10px] uppercase tracking-wider font-bold mb-2">{t('portfolio:modal.quantity')}</label>
                                <input
                                    type="number"
                                    step="any"
                                    required
                                    min="0.000001"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                                    className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-text font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
                                    placeholder="10.5"
                                />
                            </div>

                            <div>
                                <label className="block text-text-muted text-[10px] uppercase tracking-wider font-bold mb-2">{t('portfolio:modal.purchasePrice')}</label>
                                <input
                                    type="number"
                                    step="any"
                                    required
                                    min="0.000001"
                                    value={formData.price}
                                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                                    className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-text font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
                                    placeholder="150.25"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="mt-2 w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-fg font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/25 flex justify-center items-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : t('common:actions.save')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

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
