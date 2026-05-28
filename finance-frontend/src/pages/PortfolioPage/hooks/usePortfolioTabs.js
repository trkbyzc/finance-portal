import { useEffect, useMemo, useState } from 'react';

/** Tab sırası — sadece kullanıcının elinde bulunan tipler görünür, "Tümü" her zaman ilk. */
const ASSET_TYPE_ORDER = ['STOCK', 'CRYPTO', 'CURRENCY', 'COMMODITY', 'BOND', 'FUND', 'FUTURE'];

/**
 * Portföy tab state'i + filtreleme. Aktif tab'taki son varlık satıldığında
 * otomatik "Tümü"ne döner. PortfolioPage'in tab boilerplate'i tek hook'a indirgendi.
 */
export default function usePortfolioTabs(portfolio) {
    const [activeTab, setActiveTab] = useState('ALL');

    const tabsState = useMemo(() => {
        const counts = { ALL: portfolio?.length || 0 };
        ASSET_TYPE_ORDER.forEach(t => { counts[t] = 0; });
        (portfolio || []).forEach(item => {
            if (counts[item.assetType] !== undefined) counts[item.assetType]++;
        });
        const presentTypes = ASSET_TYPE_ORDER.filter(t => counts[t] > 0);
        return { tabs: ['ALL', ...presentTypes], counts };
    }, [portfolio]);

    useEffect(() => {
        if (activeTab !== 'ALL' && tabsState.counts[activeTab] === 0) {
            setActiveTab('ALL');
        }
    }, [tabsState.counts, activeTab]);

    const filteredPortfolio = useMemo(() => {
        if (activeTab === 'ALL') return portfolio || [];
        return (portfolio || []).filter(item => item.assetType === activeTab);
    }, [portfolio, activeTab]);

    return { activeTab, setActiveTab, tabsState, filteredPortfolio };
}
