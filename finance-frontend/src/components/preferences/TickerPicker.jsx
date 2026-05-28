import React, { useMemo, useState } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Asset-type başına accordion, her birinde lokal arama + multi-select checkbox.
 * Üstte global "seçilenler" chip listesi var, kullanıcı oradan tek tıkla çıkarabiliyor.
 *
 * Props:
 *   pools: { STOCK: [...], CRYPTO: [...], CURRENCY: [...], COMMODITY: [...], BOND: [...], FUND: [...] }
 *     her item: { symbol, name? }
 *   selected: Array<{ symbol, assetType }>
 *   onChange(newSelected)
 *   maxCount: int — üst limit (default 20). Aşılırsa yeni eklemeler engellenir, warning gösterilir.
 */
const TYPE_ORDER = ['STOCK', 'CRYPTO', 'CURRENCY', 'COMMODITY', 'BOND', 'FUND'];
const TYPE_COLOR = {
    STOCK: '#3b82f6', CRYPTO: '#f59e0b', CURRENCY: '#10b981',
    COMMODITY: '#eab308', BOND: '#8b5cf6', FUND: '#ec4899'
};

const keyOf = (s, t) => `${t}:${s}`;

export default function TickerPicker({ pools, selected, onChange, maxCount = 20 }) {
    const { t } = useTranslation(['preferences', 'common']);
    const [openType, setOpenType] = useState(null);
    const [searches, setSearches] = useState({});

    const selectedSet = useMemo(() => new Set(selected.map(s => keyOf(s.symbol, s.assetType))), [selected]);

    const toggle = (symbol, assetType) => {
        const k = keyOf(symbol, assetType);
        if (selectedSet.has(k)) {
            onChange(selected.filter(s => keyOf(s.symbol, s.assetType) !== k));
        } else {
            if (selected.length >= maxCount) return; // sessiz blok — UI'da limit indicator var
            onChange([...selected, { symbol, assetType }]);
        }
    };

    const remove = (symbol, assetType) => {
        const k = keyOf(symbol, assetType);
        onChange(selected.filter(s => keyOf(s.symbol, s.assetType) !== k));
    };

    return (
        <div>
            {/* Seçilenler chip bar */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                        {t('preferences:ticker.selected', 'Seçili Tickerlar')} ({selected.length}/{maxCount})
                    </label>
                    {selected.length === maxCount && (
                        <span className="text-[10px] text-warning font-semibold">
                            {t('preferences:ticker.limitReached', 'Maksimum sayıya ulaşıldı')}
                        </span>
                    )}
                </div>
                {selected.length === 0 ? (
                    <div className="text-xs text-text-muted/70 italic">
                        {t('preferences:ticker.emptyHint', 'Aşağıdaki kategorilerden varlık seçerek listene ekle.')}
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        {selected.map((s, idx) => (
                            <span
                                key={`${s.assetType}:${s.symbol}-${idx}`}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border"
                                style={{
                                    background: `${TYPE_COLOR[s.assetType] || '#64748b'}1a`,
                                    color: TYPE_COLOR[s.assetType] || '#64748b',
                                    borderColor: `${TYPE_COLOR[s.assetType] || '#64748b'}40`
                                }}
                            >
                                {s.symbol}
                                <button
                                    type="button"
                                    onClick={() => remove(s.symbol, s.assetType)}
                                    className="hover:opacity-70"
                                    aria-label="remove"
                                >
                                    <X size={11} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Accordion per type */}
            <div className="space-y-2">
                {TYPE_ORDER.map((type) => {
                    const items = pools[type] || [];
                    if (items.length === 0) return null;
                    const isOpen = openType === type;
                    const search = (searches[type] || '').toLowerCase();
                    const filtered = search
                        ? items.filter(i => (i.symbol || '').toLowerCase().includes(search) ||
                                            (i.name || '').toLowerCase().includes(search))
                        : items;
                    const typeColor = TYPE_COLOR[type] || '#64748b';
                    const selectedInType = selected.filter(s => s.assetType === type).length;

                    return (
                        <div key={type} className="bg-surface border border-border rounded-xl overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setOpenType(isOpen ? null : type)}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg transition"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full" style={{ background: typeColor }} />
                                    <span className="font-semibold">
                                        {t('common:assetTypes.' + type, type)}
                                    </span>
                                    <span className="text-xs text-text-muted">({items.length})</span>
                                    {selectedInType > 0 && (
                                        <span
                                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                                            style={{ background: typeColor }}
                                        >
                                            {selectedInType}
                                        </span>
                                    )}
                                </div>
                                <ChevronDown
                                    size={16}
                                    className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {isOpen && (
                                <div className="border-t border-border">
                                    <div className="p-3 sticky top-0 bg-surface z-10 border-b border-border">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                                            <input
                                                type="text"
                                                value={searches[type] || ''}
                                                onChange={(e) => setSearches({ ...searches, [type]: e.target.value })}
                                                placeholder={t('preferences:ticker.search', 'Bu kategoride ara...')}
                                                className="w-full bg-bg border border-border rounded-md pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {filtered.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-text-muted">
                                                {t('preferences:ticker.noMatch', 'Eşleşen varlık yok')}
                                            </div>
                                        ) : (
                                            filtered.map((item) => {
                                                const symbol = item.symbol;
                                                const k = keyOf(symbol, type);
                                                const isSelected = selectedSet.has(k);
                                                const disabled = !isSelected && selected.length >= maxCount;
                                                return (
                                                    <button
                                                        key={k}
                                                        type="button"
                                                        onClick={() => toggle(symbol, type)}
                                                        disabled={disabled}
                                                        className={`w-full flex items-center justify-between px-4 py-2 hover:bg-bg transition text-left ${
                                                            disabled ? 'opacity-40 cursor-not-allowed' : ''
                                                        } ${isSelected ? 'bg-primary/5' : ''}`}
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-sm font-semibold truncate">{symbol}</div>
                                                            {item.name && (
                                                                <div className="text-[10px] text-text-muted truncate">{item.name}</div>
                                                            )}
                                                        </div>
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                                                            isSelected
                                                                ? 'bg-primary border-primary text-primary-fg'
                                                                : 'border-border'
                                                        }`}>
                                                            {isSelected && <Check size={12} strokeWidth={3} />}
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
