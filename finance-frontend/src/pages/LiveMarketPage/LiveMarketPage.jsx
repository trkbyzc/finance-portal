import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useLiveMarketData } from '../../hooks/useLiveMarketData';
import ChartSection from './components/ChartSection';
import IndicesSection from './components/IndicesSection';
import BistHeatmapSection from './components/BistHeatmapSection';
import TurkishStocksSection from './components/TurkishStocksSection';
import CommoditiesSection from './components/CommoditiesSection';
import ForexSection from './components/ForexSection';
import BondsSection from './components/BondsSection';
import EconomySection from './components/EconomySection';
import IpoSection from './components/IpoSection';

export default function LiveMarketPage() {
    const navigate = useNavigate();
    const { t } = useTranslation('markets');

    const {
        loading, indices, ipos, trBonds,
        turkishStocks,
        highestVolume, mostVolatile, topGainers, topLosers,
        commodityCards, sortedForexList,
        economyMacro,
        economyMetric, setEconomyMetric, economyRange, setEconomyRange, economyData, economyLoading,
        // Per-section loading flags (progressive rendering)
        stocksLoading, iposLoading, commoditiesLoading, currenciesLoading, trBondsLoading
    } = useLiveMarketData();

    // indices yüklenince ilk endeksi grafik için varsayılan sembol olarak seçer; useState başlangıç değeri olarak kullanılır
    const defaultSymbol = useMemo(() => {
        if (!loading && indices && indices.length > 0) {
            return indices[0].symbol;
        }
        return '';
    }, [loading, indices]);

    const [selectedSymbol, setSelectedSymbol] = useState(defaultSymbol);

    const handleViewIndexStocks = (symbol) => {
        if (!symbol) return;

        // Yahoo Finance sembolünü (XU050.IS) kullanıcı-dostu filtre adına dönüştürür (BIST50)
        const cleanSymbol = symbol.replace('.IS', '').replace('XU', 'BIST');

        navigate('/markets/tr-stocks/list', { state: { filter: cleanSymbol } });
    };

    const handleNavigateToDetail = (sym, cat) => {
        const url = cat
            ? `/chart/${encodeURIComponent(sym)}?cat=${cat}`
            : `/chart/${encodeURIComponent(sym)}`;
        navigate(url);
    };

    if (loading) return <div className="h-screen bg-bg flex items-center justify-center text-primary"><Loader2 className="animate-spin" size={48} /></div>;

    return (
        <div className="min-h-screen bg-bg text-text p-4 md:p-8">
            <div className="max-w-[1400px] mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold mb-8 flex items-center gap-3">
                    {t('ticker.live')} {t('ticker.marketStatus')} <ChevronRight className="text-border" />
                </h1>

                <IndicesSection
                    indices={indices}
                    selectedSymbol={selectedSymbol}
                    setSelectedSymbol={setSelectedSymbol}
                />

                <ChartSection
                    selectedSymbol={selectedSymbol || defaultSymbol}
                    onNavigateToMarket={handleViewIndexStocks}
                />

                <BistHeatmapSection stocks={turkishStocks} loading={stocksLoading} />

                <TurkishStocksSection
                    highestVolume={highestVolume}
                    mostVolatile={mostVolatile}
                    topGainers={topGainers}
                    topLosers={topLosers}
                    onSelect={handleNavigateToDetail}
                    isLoading={stocksLoading}
                />

                <CommoditiesSection
                    commodityCards={commodityCards}
                    onSelect={handleNavigateToDetail}
                    navigate={navigate}
                    isLoading={commoditiesLoading}
                />

                <ForexSection
                    sortedForexList={sortedForexList}
                    onSelect={handleNavigateToDetail}
                    isLoading={currenciesLoading}
                />

                <BondsSection trBonds={trBonds} isLoading={trBondsLoading} />

                <EconomySection
                    economyMacro={economyMacro}
                    economyMetric={economyMetric}
                    setEconomyMetric={setEconomyMetric}
                    economyRange={economyRange}
                    setEconomyRange={setEconomyRange}
                    economyData={economyData}
                    economyLoading={economyLoading}
                />

                <IpoSection ipos={ipos} isLoading={iposLoading} />

            </div>
        </div>
    );
}