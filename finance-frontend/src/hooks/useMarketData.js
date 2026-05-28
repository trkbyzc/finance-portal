import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { aggregateApi } from '../services/api';

const CATEGORY_CONFIG = {
    'tr-stocks': { title: 'Türk Hisse Senetleri', icon: '🇹🇷', endpoint: '/stocks', type: 'stock', filter: 'tr' },
    'us-stocks': { title: 'Amerikan Hisse Senetleri', icon: '🇺🇸', endpoint: '/stocks', type: 'stock', filter: 'us' },
    'viop': { title: 'VİOP (Vadeli İşlem ve Opsiyon Piyasası)', icon: '⚡', endpoint: '/viop', type: 'viop' },
    'futures': { title: 'Küresel Vadeliler', icon: '📈', endpoint: '/futures', type: 'future' },
    'currencies': { title: 'Döviz Piyasası', icon: '💵', endpoint: '/currencies', type: 'currency' },
    'effective-currencies': { title: 'Efektif Döviz', icon: '💴', endpoint: '/effective-currencies', type: 'currency' },
    'bank-currencies': { title: 'Banka Kurları', icon: '🏦', endpoint: '/bank-currencies', type: 'bank' },
    'crypto': { title: 'Kripto Paralar', icon: '₿', endpoint: '/crypto-currencies', type: 'crypto' },
    'turkish-gold': { title: 'Kapalıçarşı Altın', icon: '🪙', endpoint: '/turkish-gold', type: 'gold' },
    'commodities': { title: 'Emtialar', icon: '🏗️', endpoint: '/commodities', type: 'commodity' },
    'bonds': { title: 'Global Tahviller', icon: '🌍', endpoint: '/bonds', type: 'bond' },
    'tr-bonds': { title: 'Türk Tahvil & Bono', icon: '🏦', endpoint: '/tr-bonds', type: 'bond' },
    'eurobonds': { title: 'Türkiye Eurobond', icon: '🇹🇷', endpoint: '/eurobonds', type: 'eurobond' },
    'tr-funds': { title: 'Türkiye Yatırım Fonları', icon: '🇹🇷', endpoint: '/tr-funds', type: 'fund' },
    'global-funds': { title: 'Global Fonlar (ETF)', icon: '🌍', endpoint: '/global-funds', type: 'fund' }, // BURASI DÜZELTİLDİ
    'live': { title: 'Canlı Piyasa Görünümü', icon: '🌍', endpoint: '/all', type: 'mixed' }
};

export const useMarketData = (category) => {
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['indices'];
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);

    const { data: rawData = [], isLoading: loading } = useQuery({
        queryKey: ['marketData', category, config.endpoint],
        queryFn: async () => {
            try {
                if (category === 'live') {
                    const all = await aggregateApi.getAllMarkets();
                    return [
                        ...(all.indices || []), ...(all.stocks || []),
                        ...(all.cryptos || []), ...(all.viop || []),
                        ...(all.tr_funds || []), ...(all.global_funds || [])
                    ];
                }
                const res = await aggregateApi.getMarketsByEndpoint(config.endpoint);
                return res || [];
            } catch (error) {
                console.error("Veri çekme hatası:", error);
                return [];
            }
        },
        staleTime: 30 * 1000
    });

    const filteredData = useMemo(() => {
        let processedData = rawData || [];

        if (category === 'tr-stocks') {
            processedData = processedData.filter(item => (item.yahooSymbol || item.symbol || '').endsWith('.IS'));
        } else if (category === 'us-stocks') {
            processedData = processedData.filter(item => !(item.yahooSymbol || item.symbol || '').endsWith('.IS'));
        }

        if (['tr-bonds', 'bonds', 'tr-funds', 'global-funds', 'eurobonds'].includes(category)) {
            processedData = processedData.map(item => ({
                ...item,
                chartType: 'LINE',
                assetCategory: category === 'eurobonds'
                    ? 'EUROBOND'
                    : (category.includes('funds') ? 'FUND' : 'BOND')
            }));
        }

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            processedData = processedData.filter(item => {
                const searchStr = `${item.symbol} ${item.name} ${item.currencyCode} ${item.currencyName} ${item.assetCategory}`.toLowerCase();
                return searchStr.includes(lowerSearch);
            });
        }

        return processedData;
    }, [rawData, category, searchTerm]);

    // 🚀 İlk veri geldiğinde veya filteredData değiştiğinde ilk item'ı seç
    useEffect(() => {
        if (filteredData.length > 0 && !selectedAsset) {
            setSelectedAsset(filteredData[0]);
        }
    }, [filteredData, selectedAsset]);

    // 🚀 EKSİK OLAN VİTRİN FONKSİYONU: Eski component üst sıradaki kartlar için bu limiti bekliyor
    const getShowcaseAssets = () => {
        if (!filteredData || filteredData.length === 0) return [];
        if (category === 'crypto') return filteredData.slice(0, 10);
        if (category === 'currencies' || category === 'bank-currencies') {
            const majors = ['USD', 'EUR', 'GBP', 'CHF', 'CAD'];
            return filteredData.filter(d => majors.includes(d.currencyCode?.substring(0,3))).slice(0, 5);
        }
        if (category === 'tr-stocks' || category === 'us-stocks') return filteredData.slice(0, 10);
        return filteredData.slice(0, 7);
    };

    return {
        data: filteredData,
        selectedAsset,
        setSelectedAsset,       // 👈 Artık set fonksiyonu da dışarı aktarılıyor
        loading,
        config,
        showcaseAssets: getShowcaseAssets(), // 👈 Vitrin datası verildi
        searchTerm,
        setSearchTerm
    };
};