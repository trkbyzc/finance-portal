import React, { useState } from 'react';
import { ArrowLeft, BarChart2, DollarSign, Plus, TrendingUp, TrendingDown, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../../context/CurrencyContext';
import { useAuth } from '../../../context/AuthContext';
import { formatNumber } from '../../../utils/formatters/numberFormatter';
import AlarmModal from '../../../components/alarm/AlarmModal';

export default function AssetHeader({ asset, navigate, onAddPortfolioClick }) {
    const [alarmOpen, setAlarmOpen] = useState(false);
    const { currency, toggleCurrency, formatPrice } = useCurrency();
    const { isAuthenticated } = useAuth();
    const { t } = useTranslation(['asset', 'common']);

    // Varlığın temiz kısaltması (BTC, AAPL, USD...) — 2 harflik baş harf yerine TAM sembol.
    const getTicker = () => {
        const raw = asset?.currencyCode || asset?.symbol || '';
        if (!raw) return '?';
        return raw
            .replace('TP.', '')
            .replace('.ORAN', '')
            .replace('-USD', '')
            .replace('TRY=X', '')
            .replace('=X', '')
            .replace('.IS', '')
            .toUpperCase();
    };

    const ticker = getTicker();
    // Uzun sembollerde (VİOP/tahvil) yazı taşmasın diye boyutu kademeli küçült.
    const tickerSizeClass = ticker.length <= 3 ? 'text-xl'
        : ticker.length === 4 ? 'text-lg'
        : ticker.length <= 6 ? 'text-sm'
        : 'text-[10px]';

    const changePercent = asset?.changePercent != null ? Number(asset.changePercent) : null;
    const isPositive = changePercent != null && changePercent >= 0;
    const changeColor = isPositive ? 'var(--buy)' : 'var(--sell)';

    const isCurrency = asset?.assetCategory === 'CURRENCY';
    const showCurrencyToggle = !asset?.isYieldBased && !isCurrency;

    return (
        <>
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-text-muted hover:text-text mb-6 transition-colors bg-surface border border-border hover:border-border-strong px-4 py-2 rounded-lg w-fit text-sm font-medium"
            >
                <ArrowLeft size={16} /> {t('asset:back')}
            </button>

            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-start gap-6">
                <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl bg-linear-to-br from-primary/15 to-primary/5 border border-primary/30 flex items-center justify-center font-black text-primary ${tickerSizeClass} uppercase shadow-lg shadow-primary/10 shrink-0 overflow-hidden px-1 text-center leading-tight`}>
                        {asset?.image ? (
                            <img
                                src={asset.image}
                                alt={ticker}
                                className="w-full h-full object-contain p-2"
                                onError={(e) => {
                                    // İkon yüklenmezse sembol metnine düş.
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentNode.textContent = ticker;
                                }}
                            />
                        ) : (
                            ticker
                        )}
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase text-text tracking-tight">
                            {asset?.name || asset?.symbol?.replace('-USD','').replace('.IS','')}
                        </h1>
                        <p className="text-text-muted text-sm flex items-center gap-2 mt-1">
                            <BarChart2 size={14} className="text-primary" />
                            {t('asset:tabs.fundamentals')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap md:ml-auto">
                    {asset?.displayPrice > 0 && (
                        <div className="flex items-center gap-5 bg-surface border border-border px-6 py-3 rounded-2xl shadow-md">
                            <div className="flex flex-col items-start">
                                <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider mb-1">
                                    {asset.isYieldBased ? t('asset:bond.yield') : t('asset:currentPrice')}
                                </span>
                                <span className="text-2xl md:text-3xl font-mono font-black text-text leading-none">
                                    {asset.isYieldBased
                                        ? `%${Number(asset.displayPrice).toFixed(3)}`
                                        : isCurrency
                                            ? `₺${formatNumber(asset.displayPrice, 4, 4)}`
                                            : formatPrice(asset.displayPrice, asset.nativeCurrency)}
                                </span>
                                {changePercent != null && (
                                    <span
                                        className="font-mono font-bold text-sm mt-1.5 flex items-center gap-1"
                                        style={{ color: changeColor }}
                                    >
                                        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                                        <span className="text-text-muted text-[10px] font-medium ml-1">({t('asset:changeToday')})</span>
                                    </span>
                                )}
                            </div>

                            {showCurrencyToggle && (
                                <button
                                    onClick={toggleCurrency}
                                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-all hover:scale-105 group"
                                    title={`${t('asset:showInCurrency')} (${currency})`}
                                >
                                    {currency === 'TRY' ? (
                                        <DollarSign size={22} className="group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                                    ) : (
                                        <span className="text-2xl font-black group-hover:scale-110 transition-transform">₺</span>
                                    )}
                                </button>
                            )}
                        </div>
                    )}

                    {isAuthenticated && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={onAddPortfolioClick}
                                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-fg px-5 py-3 rounded-2xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
                            >
                                <Plus size={20} /> {t('asset:addToPortfolio')}
                            </button>
                            <button
                                onClick={() => setAlarmOpen(true)}
                                title={t('asset:setAlarm', 'Fiyat alarmı kur')}
                                className="flex items-center gap-2 bg-surface-2 hover:bg-surface-hover border border-border hover:border-primary text-text px-4 py-3 rounded-2xl font-bold transition-all"
                            >
                                <Bell size={18} className="text-primary" />
                                <span className="hidden sm:inline">{t('asset:setAlarm', 'Alarm Kur')}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <AlarmModal
                open={alarmOpen}
                onClose={() => setAlarmOpen(false)}
                asset={asset}
            />
        </>
    );
}
