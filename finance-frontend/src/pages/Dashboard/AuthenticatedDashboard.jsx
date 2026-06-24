import { useMemo, useState } from 'react';
import { Settings2, Check, Plus, X, GripVertical, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData.js';
import { useDashboardLayout } from '../../hooks/useDashboardLayout.js';
import NewsSection from '../../components/news/NewsSection.jsx';

import DashboardGreeting from './components/DashboardGreeting';
import MarketSummaryStrip from './components/MarketSummaryStrip';
import PortfolioSummaryWidget from './components/PortfolioSummaryWidget';
import WatchlistWidget from './components/WatchlistWidget';
import DashboardCalculator from './components/DashboardCalculator';

/**
 * Giriş yapmış kullanıcı dashboard'u — kişiye özel ve ÖZELLEŞTİRİLEBİLİR.
 *
 * Widget'lar registry'den gelir; kullanıcı "Özelleştir" modunda sürükleyerek sıralar,
 * gizler (x) veya ekler. Yerleşim localStorage'da kalıcıdır (useDashboardLayout).
 */
export default function AuthenticatedDashboard() {
    const { t } = useTranslation(['dashboard', 'common']);
    const { user } = useAuth();
    const {
        calcAmount, setCalcAmount, calcCurrency, setCalcCurrency,
        calculatedResult, usdRate
    } = useDashboardData();

    // Karşılama için "isim" tercih — JWT name "Ad Soyad" composite, ilk kelime = ad.
    // Keycloak'ta first name boşsa name = username olur, o da bir tek kelime → fallback chain doğal.
    const displayName = user?.name?.trim().split(/\s+/)[0] || user?.username || '';
    const [editing, setEditing] = useState(false);
    const [dragKey, setDragKey] = useState(null);

    const registry = useMemo(() => ({
        marketSummary: { titleKey: 'dashboard:widgets.marketTitle', wide: true, render: () => <MarketSummaryStrip /> },
        portfolio: { titleKey: 'dashboard:widgets.portfolioTitle', wide: true, render: () => <PortfolioSummaryWidget /> },
        watchlist: { titleKey: 'dashboard:widgets.watchlistTitle', wide: true, render: () => <WatchlistWidget /> },
        calculator: {
            titleKey: 'dashboard:widgets.converterTitle', wide: false, render: () => (
                <DashboardCalculator
                    calcAmount={calcAmount} setCalcAmount={setCalcAmount}
                    calcCurrency={calcCurrency} setCalcCurrency={setCalcCurrency}
                    calculatedResult={calculatedResult} usdRate={usdRate}
                />
            )
        },
        news: {
            titleKey: 'dashboard:widgets.newsTitle', wide: false, render: () => (
                <NewsSection
                    category="Tümü"
                    titleKey="dashboard:widgets.newsTitle"
                    accent="primary"
                    limit={5}
                    className=""
                    gridClassName="grid grid-cols-1 gap-3"
                />
            )
        },
    }), [calcAmount, setCalcAmount, calcCurrency, setCalcCurrency, calculatedResult, usdRate]);

    const allKeys = useMemo(() => Object.keys(registry), [registry]);
    // username ile scope'la — aynı tarayıcıda farklı kullanıcılar kendi yerleşimini görsün.
    const { enabledKeys, availableKeys, reorder, remove, add, reset } = useDashboardLayout(allKeys, user?.username);

    const onDrop = (targetKey) => {
        if (dragKey && dragKey !== targetKey) reorder(dragKey, targetKey);
        setDragKey(null);
    };

    return (
        <div className="bg-bg text-text font-sans">
            <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
                <div className="flex items-start justify-between gap-3">
                    <DashboardGreeting name={displayName} />
                    <button
                        onClick={() => setEditing(e => !e)}
                        className={`shrink-0 mt-1 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition ${
                            editing
                                ? 'bg-primary text-primary-fg border-primary'
                                : 'bg-surface-2 hover:bg-surface-hover border-border text-text'
                        }`}
                    >
                        {editing ? <Check size={16} /> : <Settings2 size={16} />}
                        {editing ? t('dashboard:customize.done', 'Bitti') : t('dashboard:customize.edit', 'Özelleştir')}
                    </button>
                </div>

                {editing && (
                    <CustomizePanel
                        t={t}
                        registry={registry}
                        availableKeys={availableKeys}
                        onAdd={add}
                        onReset={reset}
                    />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
                    {enabledKeys.map(key => {
                        const w = registry[key];
                        if (!w) return null;
                        return (
                            <div
                                key={key}
                                className={`${w.wide ? 'lg:col-span-2' : ''} ${
                                    editing ? 'relative rounded-2xl ring-2 ring-dashed ring-border p-2 transition' : ''
                                } ${dragKey === key ? 'opacity-50' : ''}`}
                                draggable={editing}
                                onDragStart={() => editing && setDragKey(key)}
                                onDragOver={(e) => editing && e.preventDefault()}
                                onDrop={() => editing && onDrop(key)}
                                onDragEnd={() => setDragKey(null)}
                            >
                                {editing && (
                                    <div className="flex items-center justify-between mb-2 px-1">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted cursor-grab active:cursor-grabbing">
                                            <GripVertical size={14} /> {t(w.titleKey)}
                                        </span>
                                        <button
                                            onClick={() => remove(key)}
                                            className="inline-flex items-center justify-center w-6 h-6 rounded-md text-text-muted hover:text-sell hover:bg-sell/10"
                                            title={t('dashboard:customize.remove', 'Gizle')}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                                <div className={editing ? 'pointer-events-none select-none' : ''}>
                                    {w.render()}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {enabledKeys.length === 0 && (
                    <div className="text-center text-text-muted py-16">
                        {t('dashboard:customize.empty', "Tüm widget'lar gizli. Yukarıdan ekleyebilirsiniz.")}
                    </div>
                )}
            </div>
        </div>
    );
}

function CustomizePanel({ t, registry, availableKeys, onAdd, onReset }) {
    return (
        <div className="mt-4 mb-2 bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">{t('dashboard:customize.title', 'Dashboard Özelleştir')}</p>
                <button
                    onClick={onReset}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text"
                >
                    <RotateCcw size={13} /> {t('dashboard:customize.reset', 'Varsayılana Dön')}
                </button>
            </div>
            <p className="text-xs text-text-muted mb-3">{t('dashboard:customize.dragHint', "Kartları sürükleyerek sıralayın, (x) ile gizleyin.")}</p>
            {availableKeys.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {availableKeys.map(key => (
                        <button
                            key={key}
                            onClick={() => onAdd(key)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm font-semibold transition"
                        >
                            <Plus size={14} /> {t(registry[key].titleKey)}
                        </button>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-text-muted">{t('dashboard:customize.allAdded', "Tüm widget'lar ekli.")}</p>
            )}
        </div>
    );
}
