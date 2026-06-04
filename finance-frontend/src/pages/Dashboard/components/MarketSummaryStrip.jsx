import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { aggregateApi } from '../../../services/api';
import { formatNumber } from '../../../utils/formatters/numberFormatter';
import { detectNativeCurrency } from '../../../utils/currencyConversion';
import TickerPicker from '../../../components/preferences/TickerPicker';

const STORAGE_KEY = 'fp_dashboard_strip_v1';
const MAX_CARDS = 8;

// AssetType -> aggregate response list anahtarları (useTickerData ile aynı eşleme)
const POOL_KEYS = {
    STOCK: ['indices', 'stocks'],
    CRYPTO: ['cryptos'],
    CURRENCY: ['currencies'],
    COMMODITY: ['commodities', 'turkish_gold'],
    BOND: ['global_bonds', 'tr_bonds', 'eurobonds'],
    FUND: ['tr_funds', 'global_funds']
};
// Hangi havuzdan geldiğine göre grafik kategori (cat) parametresi
const KEY_CAT = {
    indices: 'INDEX', stocks: 'STOCK', cryptos: 'CRYPTO', currencies: 'CURRENCY',
    commodities: 'COMMODITY', turkish_gold: 'COMMODITY',
    global_bonds: 'BOND', tr_bonds: 'TR_BOND', eurobonds: 'EUROBOND',
    tr_funds: 'TR_FUND', global_funds: 'FUND'
};

const matchItem = (i, symbol) => i.symbol === symbol || i.currencyCode === symbol || i.code === symbol;

/** Seçili {symbol, assetType} için canlı market verisini + grafik cat'ini bulur. */
function resolveAsset(allMarkets, symbol, assetType) {
    for (const k of (POOL_KEYS[assetType] || [])) {
        const hit = (allMarkets[k] || []).find((i) => matchItem(i, symbol));
        if (hit) return { item: hit, cat: hit.assetCategory || KEY_CAT[k] || assetType };
    }
    return null;
}

const priceOf = (item, assetType) => {
    if (assetType === 'CURRENCY') return item.forexSelling ?? item.price;
    if (assetType === 'CRYPTO') return item.forexBuying ?? item.forexSelling ?? item.price;
    return item.price ?? item.forexSelling ?? item.forexBuying;
};

const CURRENCY_SYMBOLS = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' };
// Gösterilen değerin para birimi: döviz kartı TRY karşılığı (forexSelling), kripto USD;
// endeks/hisse/emtia için varlığın yerel para birimi (BIST .IS -> TRY, ABD -> USD).
const prefixOf = (item, assetType) => {
    const cur = assetType === 'CURRENCY' ? 'TRY'
        : assetType === 'CRYPTO' ? 'USD'
        : detectNativeCurrency(item);
    return CURRENCY_SYMBOLS[cur] || '';
};
// Endekslerde sembol (XU100) yerine dostça ad (BIST 100) göster; döviz/kripto'da kod kalsın.
const labelOf = (item, symbol, cat) => {
    if (cat === 'INDEX' && item.name) return item.name;
    return (item.currencyCode || item.symbol || symbol).replace('.IS', '').replace('-USD', '');
};

const chartLinkFor = (item, cat, assetType) => {
    let sym = item.symbol || item.currencyCode;
    if (assetType === 'CRYPTO') sym = item.yahooSymbol || `${item.currencyCode || item.symbol}-USD`;
    return `/chart/${encodeURIComponent(sym)}?cat=${cat}`;
};

/** allMarkets'tan varsayılan 4 majör (gerçek sembollerle). */
function buildDefault(allMarkets) {
    const pick = (keys, pred) => {
        for (const k of keys) { const hit = (allMarkets[k] || []).find(pred); if (hit) return hit; }
        return null;
    };
    const out = [];
    const bist = pick(['indices'], (i) => (i.symbol || '').includes('XU100') || i.name === 'BIST 100');
    if (bist) out.push({ symbol: bist.symbol, assetType: 'STOCK' });
    if (pick(['currencies'], (i) => i.currencyCode === 'USD')) out.push({ symbol: 'USD', assetType: 'CURRENCY' });
    if (pick(['currencies'], (i) => i.currencyCode === 'EUR')) out.push({ symbol: 'EUR', assetType: 'CURRENCY' });
    if (pick(['cryptos'], (i) => i.currencyCode === 'BTC')) out.push({ symbol: 'BTC', assetType: 'CRYPTO' });
    return out;
}

/**
 * Giriş yapmış dashboard'un üst şeridi — özelleştirilebilir varlık mini kartları.
 * Varsayılan BIST 100 / Dolar / Euro / Bitcoin; kullanıcı "Özelleştir" ile market ticker'daki
 * gibi istediği varlıkları ekler/çıkarır. Seçim localStorage'da kalıcıdır.
 */
export default function MarketSummaryStrip() {
    const { t } = useTranslation(['dashboard', 'common']);
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);

    const { data: allMarkets } = useQuery({
        queryKey: ['tickerData'], // ticker ile aynı cache'i paylaş
        queryFn: aggregateApi.getAllMarkets,
        staleTime: 30 * 1000,
        refetchInterval: 30 * 1000
    });

    // stored: kullanıcı seçimi (null = varsayılan)
    const [stored, setStored] = useState(() => {
        try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
    });

    const defaults = useMemo(() => (allMarkets ? buildDefault(allMarkets) : []), [allMarkets]);
    const selected = stored ?? defaults;

    const cards = useMemo(() => {
        if (!allMarkets) return [];
        return selected.map((sel) => {
            const resolved = resolveAsset(allMarkets, sel.symbol, sel.assetType);
            if (!resolved) return { key: `${sel.assetType}:${sel.symbol}`, label: sel.symbol, missing: true };
            const { item, cat } = resolved;
            return {
                key: `${sel.assetType}:${sel.symbol}`,
                label: labelOf(item, sel.symbol, cat),
                value: priceOf(item, sel.assetType),
                change: item.changePercent,
                prefix: prefixOf(item, sel.assetType),
                onClick: () => navigate(chartLinkFor(item, cat, sel.assetType))
            };
        });
    }, [allMarkets, selected, navigate]);

    const saveSelection = (next) => {
        setStored(next);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* kota yoksa yoksay */ }
    };
    const resetSelection = () => {
        setStored(null);
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* yoksay */ }
    };

    return (
        <div className="mb-8">
            <div className="flex items-center justify-end mb-2">
                <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted hover:text-primary px-2.5 py-1.5 rounded-lg hover:bg-surface-2 transition-colors"
                >
                    <SlidersHorizontal size={13} /> {t('dashboard:summary.customize', 'Kartları Düzenle')}
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card) => {
                    const hasData = !card.missing && card.value != null;
                    const change = Number(card.change || 0);
                    const isUp = change >= 0;
                    return (
                        <button
                            key={card.key}
                            onClick={card.onClick}
                            disabled={card.missing}
                            className="text-left bg-surface border border-border rounded-2xl p-5 hover:border-primary/50 hover:shadow-lg transition-all group disabled:opacity-50"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-text-muted text-[11px] font-bold uppercase tracking-wider truncate">{card.label}</span>
                                {hasData && (
                                    <span className={`flex items-center gap-0.5 text-xs font-bold shrink-0 ${isUp ? 'text-buy' : 'text-sell'}`}>
                                        {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {isUp ? '+' : ''}{change.toFixed(2)}%
                                    </span>
                                )}
                            </div>
                            <div className="text-xl font-mono font-black text-text group-hover:text-primary transition-colors">
                                {hasData ? `${card.prefix}${formatNumber(card.value, 2, 2)}` : '—'}
                            </div>
                        </button>
                    );
                })}
                {cards.length === 0 && (
                    <div className="col-span-2 lg:col-span-4 text-center text-sm text-text-muted py-8 bg-surface border border-border rounded-2xl">
                        {t('dashboard:summary.empty', 'Henüz varlık seçilmedi. "Özelleştir" ile ekleyin.')}
                    </div>
                )}
            </div>

            {editing && (
                <StripCustomizeModal
                    allMarkets={allMarkets}
                    selected={selected}
                    onSave={(next) => { saveSelection(next); setEditing(false); }}
                    onReset={() => { resetSelection(); setEditing(false); }}
                    onClose={() => setEditing(false)}
                />
            )}
        </div>
    );
}

/** "Özelleştir" modalı — TickerPicker ile market ticker'daki seçim deneyiminin aynısı. */
function StripCustomizeModal({ allMarkets, selected, onSave, onReset, onClose }) {
    const { t } = useTranslation(['dashboard', 'common']);
    const [draft, setDraft] = useState(selected);

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const pools = useMemo(() => {
        if (!allMarkets) return {};
        const mk = (arr) => (arr || [])
            .map((i) => ({ symbol: i.symbol || i.currencyCode || i.code, name: i.name || i.currencyName }))
            .filter((x) => x.symbol);
        return {
            STOCK: [...mk(allMarkets.indices), ...mk(allMarkets.stocks)],
            CRYPTO: mk(allMarkets.cryptos),
            CURRENCY: mk(allMarkets.currencies),
            COMMODITY: [...mk(allMarkets.commodities), ...mk(allMarkets.turkish_gold)],
            BOND: [...mk(allMarkets.global_bonds), ...mk(allMarkets.tr_bonds), ...mk(allMarkets.eurobonds)],
            FUND: [...mk(allMarkets.tr_funds), ...mk(allMarkets.global_funds)]
        };
    }, [allMarkets]);

    return (
        <div className="fixed inset-0 z-110 flex items-start justify-center sm:items-center bg-black/70 backdrop-blur-md p-4">
            <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div>
                        <h3 className="text-lg font-bold text-text">{t('dashboard:summary.customizeTitle', 'Özet kartlarını özelleştir')}</h3>
                        <p className="text-xs text-text-muted mt-0.5">{t('dashboard:summary.customizeHint', 'Üst şeritte gösterilecek varlıkları seç.')}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors -mr-1"
                        aria-label={t('common:actions.cancel')}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    <TickerPicker pools={pools} selected={draft} onChange={setDraft} maxCount={MAX_CARDS} />
                </div>

                <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border bg-surface-2/40">
                    <button
                        onClick={onReset}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-text px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors"
                    >
                        <RotateCcw size={14} /> {t('dashboard:summary.reset', 'Varsayılana dön')}
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg font-bold text-text bg-surface-2 hover:bg-surface-hover border border-border transition-all text-sm"
                        >
                            {t('common:actions.cancel')}
                        </button>
                        <button
                            onClick={() => onSave(draft)}
                            className="px-4 py-2 rounded-lg font-bold text-primary-fg bg-primary hover:bg-primary-hover transition-all shadow-md text-sm"
                        >
                            {t('common:actions.save')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
