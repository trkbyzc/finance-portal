import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search } from 'lucide-react';
import { Skeleton, MarketTableSkeleton } from '../../components/ui/Skeleton';
import { aggregateApi } from '../../services/api';

export default function MarketListPage() {
    const { category } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // 🚀 Önceki sayfadan (LiveMarket) gelen bir filtre varsa onu yakala (Örn: "BIST50")
    const incomingFilter = location.state?.filter || 'ALL';

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState(incomingFilter); // 🚀 Aktif Sekme State'i

    const endpointMap = {
        'tr-stocks': '/stocks', 'us-stocks': '/stocks', 'crypto': '/crypto-currencies',
        'currencies': '/currencies', 'bonds': '/bonds', 'tr-bonds': '/tr-bonds',
        'indices': '/indices', 'viop': '/viop', 'commodities': '/commodities',
        'tr-funds': '/tr-funds', 'global-funds': '/funds'
    };

    // Route param -> backend category map
    const categoryMap = {
        'tr-stocks': 'STOCK', 'us-stocks': 'STOCK',
        'crypto': 'CRYPTO', 'currencies': 'CURRENCY',
        'indices': 'INDEX', 'tr-bonds': 'TR_BOND', 'bonds': 'BOND',
        'viop': 'VIOP', 'commodities': 'COMMODITY',
        'tr-funds': 'TR_FUND', 'global-funds': 'FUND'
    };
    const routeCategory = categoryMap[category] || null;

    const titleMap = {
        'tr-stocks': 'BIST Hisse Senetleri', 'us-stocks': 'ABD Hisse Senetleri',
        'crypto': 'Kripto Paralar', 'currencies': 'Döviz Piyasası',
        'indices': 'Türkiye Endeksleri', 'tr-bonds': 'Türk Tahvil & Bono',
        'bonds': 'Global Tahviller', 'viop': 'VİOP Vadeli İşlemler',
        'commodities': 'Emtia & Vadeli', 'tr-funds': 'Türkiye Yatırım Fonları',
        'global-funds': 'Global Fonlar (ETF)', 'live': 'Tüm Piyasalar'
    };

    const { data = [], isLoading: loading } = useQuery({
        queryKey: ['marketList', category],
        queryFn: async () => {
            let rawData = [];
            const endpoint = endpointMap[category];

            if (endpoint) {
                const res = await aggregateApi.getMarketsByEndpoint(endpoint);
                rawData = res || [];
            } else if (category === 'live' || category === 'all') {
                const res = await aggregateApi.getAllMarkets();
                rawData = [
                    ...(res.indices || []), ...(res.stocks || []), ...(res.crypto || []),
                    ...(res.currencies || []), ...(res.bonds || []), ...(res.tr_funds || []),
                    ...(res.global_funds || [])
                ];
            }

            if (category === 'tr-stocks') rawData = rawData.filter(item => (item.yahooSymbol || item.symbol || '').endsWith('.IS'));
            if (category === 'us-stocks') rawData = rawData.filter(item => !(item.yahooSymbol || item.symbol || '').endsWith('.IS'));
            if (category === 'currencies') rawData = rawData.filter(item => item.currencyCode && !item.currencyCode.includes('XAU'));

            const uniqueAssets = [];
            const seen = new Set();
            for (let item of rawData) {
                const sym = item.yahooSymbol || item.symbol || item.currencyCode;
                if (!seen.has(sym)) {
                    seen.add(sym);
                    uniqueAssets.push(item);
                }
            }
            return uniqueAssets;
        },
        staleTime: 30 * 1000
    });

    // 🚀 Frontend Filtrelemesi (Hem Arama Hem de BIST Tabları)
    const filteredData = data.filter(item => {
        // 1. Endeks Filtresi Kontrolü (Artık backend'den gelen boolean değerlere bakıyoruz)
        // 1. Endeks Filtresi Kontrolü (Artık backend'den gelen boolean değerlere bakıyoruz)
        if (activeTab && activeTab !== 'ALL') {
            if (activeTab === 'BIST30' && !item.inBist30) return false;
            if (activeTab === 'BIST50' && !item.inBist50) return false;
            if (activeTab === 'BIST100' && !item.inBist100) return false;
        }

        // 2. Arama Çubuğu Kontrolü
        if (!searchTerm) return true;
        const searchStr = `${item.symbol} ${item.name} ${item.currencyCode} ${item.currencyName}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    if (loading) return (
        <div className="min-h-screen bg-bg text-text">
            <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
                <div className="flex items-center gap-4 mb-8">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <Skeleton className="h-11 w-full max-w-md mb-6 rounded-xl" />
                <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                    <MarketTableSkeleton rows={12} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-bg text-text">
            <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">

                {/* HEADERS */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 bg-surface-2 border border-border rounded-lg hover:text-text text-text-muted transition">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-2xl sm:text-3xl font-bold">{titleMap[category] || 'Piyasalar'}</h1>
                    </div>
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Sembol veya isim ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-80 bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-text outline-none focus:border-primary transition"
                        />
                    </div>
                </div>

                {/* 🚀 YENİ EKLENEN BIST TABLARI (Sadece tr-stocks kategorisinde görünür) */}
                {category === 'tr-stocks' && (
                    <div className="flex gap-2 overflow-x-auto mb-6 pb-2 hide-scrollbar">
                        {['ALL', 'BIST100', 'BIST50', 'BIST30'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                                    activeTab === tab
                                        ? 'bg-primary text-text shadow-lg shadow-primary/20'
                                        : 'bg-surface-2 text-text-muted hover:text-text border border-border hover:border-border-strong'
                                }`}
                            >
                                {tab === 'ALL' ? 'TÜM HİSSELER' : tab.replace('BIST', 'BIST ')}
                            </button>
                        ))}
                    </div>
                )}

                {/* TABLE */}
                <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-2 border-b border-border">
                            <tr className="text-text-muted text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Sembol / Varlık</th>
                                <th className="p-4 font-semibold text-right">Fiyat</th>
                                <th className="p-4 font-semibold text-right">Değişim</th>
                                {category === 'currencies' && <th className="p-4 font-semibold text-right">Alış</th>}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2a2e39]/50">
                            {filteredData.map((item, i) => {
                                const symbol = item.symbol || item.currencyCode;
                                const isFund = category.includes('fund');
                                const itemCat = item.assetCategory || routeCategory;
                                const target = `/chart/${encodeURIComponent(item.yahooSymbol || symbol)}${itemCat ? `?cat=${itemCat}` : ''}`;
                                return (
                                    <tr
                                        key={i}
                                        onClick={() => navigate(target)}
                                        className="hover:bg-surface-2 transition-colors cursor-pointer group"
                                    >
                                        <td className="p-4">
                                            <div className="font-bold text-text group-hover:text-primary transition-colors">
                                                {symbol.replace('-USD', '').replace('.IS', '')}
                                            </div>
                                            <div className="text-xs text-text-muted truncate max-w-[200px] md:max-w-[300px]">
                                                {item.name || item.currencyName || 'Market Asset'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-mono">
                                            {isFund && category === 'tr-funds' ? (
                                                <span className="text-text-muted text-xs">Aylık Getiri</span>
                                            ) : (
                                                (item.price || item.forexSelling)?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                                            )}
                                        </td>
                                        <td className={`p-4 text-right font-mono font-bold ${item.changePercent >= 0 ? 'text-buy' : 'text-sell'}`}>
                                            {item.changePercent > 0 ? '+' : ''}{(item.changePercent || 0).toFixed(2)}%
                                        </td>
                                        {category === 'currencies' && (
                                            <td className="p-4 text-right font-mono text-text">
                                                {item.forexBuying?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                        {filteredData.length === 0 && (
                            <div className="p-8 text-center text-text-muted">
                                Aramanıza uygun sonuç bulunamadı.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}