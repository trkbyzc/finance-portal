import { useState, useMemo } from 'react';
import { useMarketData } from '../../../../hooks/useMarketData';
import { useNewsData } from '../../../../hooks/useNewsData';
import CryptoHeader from './components/CryptoHeader';
import CryptoStats from './components/CryptoStats';
import CryptoTable from './components/CryptoTable';
import CryptoNewsSidebar from './components/CryptoNewsSidebar';

export default function CryptoDashboard() {
    const { data: coins, loading: isLoading } = useMarketData('crypto');
    const { news, loading: loadingNews } = useNewsData('Kripto');
    const [searchQuery, setSearchQuery] = useState("");

    // coins listesi büyük olabileceğinden arama filtresi her render'da tekrar çalışmasın
    const filteredCoins = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return coins;

        return coins.filter(c => {
            const symbol = c.currencyCode?.toLowerCase() || "";
            const name = c.currencyName?.toLowerCase() || "";

            return symbol.includes(query) || name.includes(query);
        });
    }, [searchQuery, coins]);

    return (
        <div className="min-h-screen bg-bg text-text">
          <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
            <CryptoHeader
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            <CryptoStats coins={coins} loading={isLoading} />

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-2/3 xl:w-3/4">
                    <CryptoTable
                        data={filteredCoins}
                        loading={isLoading}
                    />
                </div>

                <div className="w-full lg:w-1/3 xl:w-1/4">
                    <CryptoNewsSidebar
                        news={news}
                        loading={loadingNews}
                    />
                </div>
            </div>
          </div>
        </div>
    );
}