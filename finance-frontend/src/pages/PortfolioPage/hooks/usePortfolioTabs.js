import { useEffect, useMemo, useState } from 'react';
import { assetNature, NATURE_ORDER } from '../../../utils/assetNature';

/**
 * Portföy sekme state'i + filtreleme — varlık DOĞASINA göre (Spot / Sabit Getiri / Türev).
 * Tek sütun setinde fiyat-bazlı (spot) ve getiri-bazlı (tahvil) karışmasın diye doğa-bazlı gruplama.
 * Aktif sekmedeki son varlık satıldığında otomatik "Tümü"ne döner.
 */
export default function usePortfolioTabs(portfolio) {
    const [activeTab, setActiveTab] = useState('ALL');

    const tabsState = useMemo(() => {
        const counts = { ALL: portfolio?.length || 0 };
        NATURE_ORDER.forEach(n => { counts[n] = 0; });
        (portfolio || []).forEach(item => {
            const nat = assetNature(item.assetType);
            if (counts[nat] !== undefined) counts[nat]++;
        });
        const presentNatures = NATURE_ORDER.filter(n => counts[n] > 0);
        return { tabs: ['ALL', ...presentNatures], counts };
    }, [portfolio]);

    useEffect(() => {
        if (activeTab !== 'ALL' && tabsState.counts[activeTab] === 0) {
            setActiveTab('ALL');
        }
    }, [tabsState.counts, activeTab]);

    const filteredPortfolio = useMemo(() => {
        if (activeTab === 'ALL') return portfolio || [];
        return (portfolio || []).filter(item => assetNature(item.assetType) === activeTab);
    }, [portfolio, activeTab]);

    return { activeTab, setActiveTab, tabsState, filteredPortfolio };
}
