import { useEffect, useRef, useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Asset search dropdown — "Ekle" butonuna basılınca açılır, arama yapılır,
 * ya da boşken popüler 6 öneri gösterilir. Outside click ile kapanır.
 */
export default function ComparisonAssetSearch({ allAssets, primaryYahoo, comparisonAssets, onAdd }) {
    const { t } = useTranslation('common');
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef(null);

    const filteredAssets = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) {
            const popularSymbols = ['XU100.IS', 'USD', 'GC=F', 'BTC-USD', 'THYAO.IS', 'AAPL'];
            return allAssets.filter(a =>
                popularSymbols.includes(a.symbol.toUpperCase()) &&
                a.yahooSymbol !== primaryYahoo &&
                !comparisonAssets.some(c => c.yahooSymbol === a.yahooSymbol)
            );
        }
        return allAssets.filter(a =>
            (a.label.toLowerCase().includes(query) || a.symbol.toLowerCase().includes(query)) &&
            a.yahooSymbol !== primaryYahoo &&
            !comparisonAssets.some(c => c.yahooSymbol === a.yahooSymbol)
        ).slice(0, 30);
    }, [searchQuery, allAssets, primaryYahoo, comparisonAssets]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsAdding(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAdd = (e) => {
        e.preventDefault();
        const query = searchQuery.trim().toUpperCase();
        if (!query) return;
        const found = allAssets.find(a => a.symbol.toUpperCase() === query || a.yahooSymbol.toUpperCase() === query);
        onAdd(found || { label: query, symbol: query, yahooSymbol: query });
        setSearchQuery('');
        setIsAdding(false);
    };

    const handlePickFromList = (ast) => {
        onAdd(ast);
        setIsAdding(false);
        setSearchQuery('');
    };

    if (!isAdding) {
        return (
            <button onClick={() => setIsAdding(true)} className="flex items-center gap-1 px-3 py-1 bg-surface-2 text-text-muted hover:text-text border border-border hover:border-border-strong rounded-md text-sm shadow-sm transition">
                <Plus size={16} /> {t('actions.add')}
            </button>
        );
    }

    return (
        <div ref={dropdownRef} className="relative z-50">
            <form onSubmit={handleAdd} className="flex items-center">
                <div className="relative">
                    <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('actions.search')}
                        className="w-48 pl-7 pr-2 py-1 bg-surface-2 text-text border border-primary rounded-l-md outline-none text-sm uppercase"
                        autoFocus
                    />
                </div>
                <button type="submit" className="px-3 py-1 bg-primary text-text hover:bg-primary-hover rounded-r-md text-sm font-medium transition cursor-pointer">
                    {t('actions.add')}
                </button>
            </form>
            <div className="absolute top-full left-0 mt-1 w-80 max-h-72 overflow-y-auto bg-surface-2 border border-border rounded-md shadow-2xl custom-scrollbar">
                {!searchQuery && filteredAssets.length > 0 && (
                    <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider bg-surface border-b border-border">
                        {t('actions.viewMore')}
                    </div>
                )}
                {filteredAssets.length > 0 ? (
                    filteredAssets.map(ast => (
                        <div
                            key={ast.yahooSymbol}
                            onClick={() => handlePickFromList(ast)}
                            className="px-3 py-2 text-sm hover:bg-primary/20 cursor-pointer transition border-b border-border/50 last:border-none flex items-center justify-between gap-2 group"
                            title={`${ast.yahooSymbol} · ${ast.label}`}
                        >
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-bold text-text truncate">{ast.yahooSymbol || ast.symbol}</span>
                                <span className="text-[10px] text-text-muted truncate">{ast.label || '—'}</span>
                            </div>
                            {ast.category && ast.category !== 'UNKNOWN' && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-surface-hover text-text-muted group-hover:bg-primary group-hover:text-text shrink-0">
                                    {ast.category}
                                </span>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="px-3 py-3 text-xs text-text-muted text-center">
                        {searchQuery ? t('status.noResults') : t('actions.search') + '...'}
                    </div>
                )}
            </div>
        </div>
    );
}
