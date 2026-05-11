import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { aggregateApi } from '../../services/api';

export default function MarketListPage() {
    const { category } = useParams();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');

    const endpointMap = {
        'tr-stocks': '/stocks', 'us-stocks': '/stocks', 'crypto': '/crypto-currencies',
        'currencies': '/currencies', 'bonds': '/bonds', 'tr-bonds': '/tr-bonds',
        'indices': '/indices', 'viop': '/viop', 'commodities': '/commodities',
        'tr-funds': '/tr-funds', 'global-funds': '/funds'
    };

    const titleMap = {
        'tr-stocks': 'BIST Hisse Senetleri', 'us-stocks': 'ABD Hisse Senetleri',
        'crypto': 'Kripto Paralar', 'currencies': 'Döviz Piyasası',
        'indices': 'Türkiye Endeksleri', 'tr-bonds': 'Türk Tahvil & Bono',
        'bonds': 'Global Tahviller', 'viop': 'VİOP Vadeli İşlemler',
        'commodities': 'Emtia & Vadeli', 'tr-funds': 'Türkiye Yatırım Fonları',
        'global-funds': 'Global Fonlar (ETF)', 'live': 'Tüm Piyasalar'
    };

    // 🚀 Bütün manuel useEffect ve Axios işlemleri React Query'e alındı!
    const { data = [], isLoading: loading } = useQuery({
        queryKey: ['marketList', category],
        queryFn: async () => {
            let rawData = [];
            const endpoint = endpointMap[category];

            if (endpoint) {
                // Merkezi yapımızı kullanarak veri çekiyoruz (Hardcoded http://localhost YOK!)
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

            // Filtrelemeler (Özel İş Mantığı)
            if (category === 'tr-stocks') rawData = rawData.filter(item => (item.yahooSymbol || item.symbol || '').endsWith('.IS'));
            if (category === 'us-stocks') rawData = rawData.filter(item => !(item.yahooSymbol || item.symbol || '').endsWith('.IS'));
            if (category === 'currencies') rawData = rawData.filter(item => item.currencyCode && !item.currencyCode.includes('XAU'));

            // Set kontrolüyle aynı elemandan birden fazla olmasını engelliyoruz
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

    // 🚀 Frontend arama filtresi (Client-Side Search)
    const filteredData = data.filter(item => {
        if (!searchTerm) return true;
        const searchStr = `${item.symbol} ${item.name} ${item.currencyCode} ${item.currencyName}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-[#0b0e14]">
            <Loader2 className="animate-spin text-[#2962ff]" size={48} />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0b0e14] text-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto">

                {/* HEADERS */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 bg-[#1e222d] border border-[#2a2e39] rounded-lg hover:text-white text-[#868993] transition">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-3xl font-bold">{titleMap[category] || 'Piyasalar'}</h1>
                    </div>
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#868993]" size={18} />
                        <input
                            type="text"
                            placeholder="Sembol veya isim ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-80 bg-[#131722] border border-[#2a2e39] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-[#2962ff] transition"
                        />
                    </div>
                </div>

                {/* TABLE */}
                <div className="bg-[#131722] border border-[#2a2e39] rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#1e222d] border-b border-[#2a2e39]">
                            <tr className="text-[#868993] text-xs uppercase tracking-wider">
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
                                return (
                                    <tr
                                        key={i}
                                        onClick={() => navigate(`/chart/${encodeURIComponent(item.yahooSymbol || symbol)}`)}
                                        className="hover:bg-[#1e222d] transition-colors cursor-pointer group"
                                    >
                                        <td className="p-4">
                                            <div className="font-bold text-white group-hover:text-[#2962ff] transition-colors">
                                                {symbol.replace('-USD', '').replace('.IS', '')}
                                            </div>
                                            <div className="text-xs text-[#868993] truncate max-w-[200px] md:max-w-[300px]">
                                                {item.name || item.currencyName || 'Market Asset'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-mono">
                                            {isFund && category === 'tr-funds' ? (
                                                <span className="text-[#868993] text-xs">Aylık Getiri</span>
                                            ) : (
                                                (item.price || item.forexSelling)?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                                            )}
                                        </td>
                                        <td className={`p-4 text-right font-mono font-bold ${item.changePercent >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                                            {item.changePercent > 0 ? '+' : ''}{(item.changePercent || 0).toFixed(2)}%
                                        </td>
                                        {category === 'currencies' && (
                                            <td className="p-4 text-right font-mono text-[#d1d4dc]">
                                                {item.forexBuying?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                        {filteredData.length === 0 && (
                            <div className="p-8 text-center text-[#868993]">
                                Aramanıza uygun sonuç bulunamadı.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}