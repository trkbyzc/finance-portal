import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { useTranslation } from 'react-i18next';
import { useAssetDetails } from '../../hooks/useAssetDetails';
import { portfolioApi } from '../../services/api/portfolioApi';
import { useNotify } from '../../context/NotificationContext';
import { useCurrency } from '../../context/CurrencyContext';
import { toBackendAssetType } from '../../utils/assetTypeMapper';

import AssetHeader from './components/AssetHeader';
import AssetChartArea from './components/AssetChartArea';
import BondDetailView from './components/BondDetailView';
import ComparisonSection from './components/ComparisonSection';
import StockFundamentals from './components/StockFundamentals';
import RelatedNews from './components/RelatedNews';

const CUR_SYMBOL = { TRY: '₺', USD: '$' };

export default function AssetDetailPage() {
    const { symbol } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation(['asset', 'common', 'portfolio']);
    const notify = useNotify();
    const { currency, convertPrice, toNative } = useCurrency();

    const { asset, loading, isTrBond, isViop, decodedSymbol } = useAssetDetails(symbol);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({ quantity: '', price: '' });
    const [targetPortfolioId, setTargetPortfolioId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Hedef portföy seçici için portföyler (modal açıkken çekilir; detay sayfası public olabilir)
    const { data: portfolios = [] } = useQuery({
        queryKey: ['portfolios'],
        queryFn: portfolioApi.getPortfolios,
        enabled: isAddModalOpen
    });

    if (loading) return (
        <div className="min-h-screen bg-bg">
            <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
                {/* Başlık satırı: geri + sembol/fiyat */}
                <div className="flex items-center gap-4 mb-8">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-3 w-20 opacity-70" />
                    </div>
                    <div className="ml-auto flex flex-col items-end gap-2">
                        <Skeleton className="h-7 w-28" />
                        <Skeleton className="h-3 w-16 opacity-70" />
                    </div>
                </div>
                {/* Temel veriler kartı */}
                <div className="bg-surface border border-border rounded-3xl p-6 mb-8">
                    <Skeleton className="h-4 w-40 mb-4" />
                    <Skeleton className="h-2 w-full mb-5 rounded-full" />
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-14 rounded-xl" />
                        ))}
                    </div>
                </div>
                {/* Grafik bloğu */}
                <Skeleton className="h-[650px] w-full rounded-3xl" />
            </div>
        </div>
    );

    if (isTrBond && asset) {
        return <BondDetailView asset={asset} navigate={navigate} />;
    }

    // Varlığın native birimi; alış fiyatı seçili para biriminde gösterilir, kayıtta native'e çevrilir.
    const nativeCur = asset?.nativeCurrency || 'TRY';

    const handleOpenModal = () => {
        // Fiyatı seçili para birimine çevirip ön-doldur (header'da görünen fiyatla aynı)
        const displayVal = asset?.displayPrice ? convertPrice(asset.displayPrice, nativeCur) : '';
        setFormData({
            quantity: '1',
            price: displayVal ? String(+Number(displayVal).toFixed(6)) : ''
        });
        setTargetPortfolioId('');
        setIsAddModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const isViop = asset?.assetCategory === 'VIOP';
            const pid = targetPortfolioId || portfolios[0]?.id;
            const payload = {
                symbol: asset?.symbol || decodedSymbol,
                assetType: toBackendAssetType(asset?.assetCategory),
                quantity: parseFloat(formData.quantity),
                // Girilen fiyat seçili para biriminde → native'e çevrilip saklanır
                averagePrice: toNative(parseFloat(formData.price), nativeCur),
                ...(pid ? { portfolioId: pid } : {}),
                // VİOP'ta sözleşme büyüklüğü (çarpan) holding'e snapshot'lanır
                ...(isViop ? { contractSize: Number(asset?.contractSize) || 1 } : {})
            };

            await portfolioApi.addManualEntry(payload);

            setIsAddModalOpen(false);

            const pname = portfolios.find(p => p.id === pid)?.name;
            notify({
                type: 'success',
                title: t('portfolio:notify.assetAdded', 'Portföye eklendi'),
                message: pname
                    ? t('portfolio:notify.assetAddedToMsg', '{{symbol}} → {{portfolio}} portföyüne eklendi.', { symbol: payload.symbol, portfolio: pname })
                    : t('portfolio:notify.assetAddedMsg', '{{symbol}} portföyünüze eklendi.', { symbol: payload.symbol })
            });

        } catch (error) {
            console.error("Add to portfolio error:", error);
            notify({
                type: 'error',
                title: t('portfolio:notify.assetAddError', 'Eklenemedi'),
                message: error.response?.data?.message || t('common:status.error')
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg text-text relative">
            <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
                <AssetHeader asset={asset} navigate={navigate} onAddPortfolioClick={handleOpenModal} />
                {asset?.assetCategory === 'STOCK' && (
                    <StockFundamentals symbol={asset?.yahooSymbol || asset?.symbol} />
                )}
                <AssetChartArea asset={asset} isViop={isViop} />
                <ComparisonSection asset={asset} baseSymbol={asset?.yahooSymbol || asset?.symbol} />
                <RelatedNews symbol={asset?.yahooSymbol || asset?.symbol} />
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

                            {portfolios.length > 1 && (
                                <div>
                                    <label className="block text-text-muted text-[10px] uppercase tracking-wider font-bold mb-2">{t('portfolio:modal.targetPortfolio', 'Hangi portföye?')}</label>
                                    <select
                                        value={targetPortfolioId || portfolios[0]?.id || ''}
                                        onChange={(e) => setTargetPortfolioId(e.target.value)}
                                        className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all appearance-none cursor-pointer"
                                    >
                                        {portfolios.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

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
                                <label className="block text-text-muted text-[10px] uppercase tracking-wider font-bold mb-2">{t('portfolio:modal.purchasePrice')} ({CUR_SYMBOL[currency] || currency})</label>
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

                            {asset?.assetCategory === 'VIOP' && (
                                <div className="bg-surface-2 border border-border rounded-xl p-3 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-text-muted">{t('portfolio:modal.contractSize', 'Sözleşme Büyüklüğü (çarpan)')}</span>
                                        <span className="font-bold text-text">× {Number(asset?.contractSize) || 1}</span>
                                    </div>
                                    {parseFloat(formData.quantity) > 0 && (
                                        <div className="flex justify-between mt-1.5">
                                            <span className="text-text-muted">{t('portfolio:modal.notional', 'Nominal Değer')}</span>
                                            <span className="font-bold text-primary">
                                                {((parseFloat(formData.price) || Number(asset?.displayPrice) || 0) * (Number(asset?.contractSize) || 1) * parseFloat(formData.quantity)).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-text-muted mt-1.5">{t('portfolio:modal.notionalHint', 'Nominal = fiyat × çarpan × adet. Portföy değeri ve K/Z bu çarpanla hesaplanır.')}</p>
                                </div>
                            )}

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
        </div>
    );
}
