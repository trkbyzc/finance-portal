import { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
// 🚀 FAZA 3: Yeni API servisleri
import {
    indexApi, stockApi, commodityApi,
    currencyApi, bondFundApi, economyApi
} from '../services/api';

export const useLiveMarketData = () => {
    // A. EKONOMİ STATE MANTIKLARI (Sadece UI'ı ilgilendiren state'ler kalır)
    const [economyMetric, setEconomyMetric] = useState('inflationRate');
    const [economyRange, setEconomyRange] = useState('10y');

    // B. REACT QUERY İLE BİRDEN FAZLA İSTEĞİ (PROMISE.ALL) YÖNETMEK
    // useQueries yardımıyla her bir domain'in isteğini ayrı ayrı, paralel ve cache'li olarak çekiyoruz
    const results = useQueries({
        queries: [
            { queryKey: ['indices'], queryFn: indexApi.getIndices },
            { queryKey: ['stocks'], queryFn: stockApi.getAllStocks },
            { queryKey: ['ipos'], queryFn: economyApi.getHalkaArz },
            { queryKey: ['commodities'], queryFn: commodityApi.getAllCommodities },
            { queryKey: ['currencies'], queryFn: currencyApi.getAllCurrencies },
            { queryKey: ['trBonds'], queryFn: bondFundApi.getTrBonds },
            { queryKey: ['globalBonds'], queryFn: bondFundApi.getGlobalBonds },
            { queryKey: ['globalFunds'], queryFn: bondFundApi.getGlobalFunds },
            { queryKey: ['trFunds'], queryFn: bondFundApi.getTrFunds },
            { queryKey: ['economyMacro'], queryFn: economyApi.getMacroEconomy }
        ]
    });

    // C. YÜKLENME DURUMU
    // Herhangi biri hala yükleniyorsa `loading = true`
    const loading = results.some(result => result.isLoading);

    // Verileri array'den yıkım yöntemiyle çıkarıyoruz. Sonuçlar başarılı geldiğinde data, yoksa boş array / null
    const [
        indicesRes, stocksRes, iposRes, commoditiesRes, currenciesRes,
        trBondsRes, globalBondsRes, globalFundsRes, trFundsRes, economyMacroRes
    ] = results;

    const indices = indicesRes.data || [];
    const stocks = stocksRes.data || [];
    const ipos = iposRes.data || [];
    const commodities = commoditiesRes.data || [];
    const currencies = currenciesRes.data || [];
    // EVDS servisi tr-bonds verisini bir iç objede tutabiliyor, o yüzden ?.value önlemi alıyoruz
    const trBonds = trBondsRes.data?.value || trBondsRes.data || [];
    const globalBonds = globalBondsRes.data || [];
    const globalFunds = globalFundsRes.data || [];
    const trFunds = trFundsRes.data || [];
    const economyMacro = economyMacroRes.data || null;

    // D. EKONOMİ GEÇMİŞ VERİSİ SORGUSU (Bağımlı Sorgu)
    // economyMetric ve economyRange değiştikçe otomatik tekrar tetiklenir
    const { data: economyData = [], isLoading: economyLoading } = useQuery({
        queryKey: ['economyHistorical', economyMetric, economyRange],
        queryFn: () => economyApi.getHistoricalEconomy(economyMetric, economyRange)
    });

    // E. BUSINESS LOGIC (VERİ DÖNÜŞÜMLERİ)
    // Filtreleme hesaplamalarını useQuery sonrasına taşıdık.
    const turkishStocks = stocks.filter(stock => stock.symbol && stock.symbol.endsWith('.IS'));
    const highestVolume = [...turkishStocks].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 5);
    const mostVolatile = [...turkishStocks].sort((a, b) => Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0)).slice(0, 5);
    const topGainers = [...turkishStocks].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)).slice(0, 5);
    const topLosers = [...turkishStocks].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0)).slice(0, 5);

    const usdTry = currencies.find(c => c.currencyCode === 'USD');
    const gold = commodities.find(c => c.symbol === 'GC=F');

    let gramAltin = null;
    if (gold && usdTry) {
        gramAltin = {
            price: (gold.price / 31.1035) * usdTry.forexSelling,
            changePercent: gold.changePercent,
            symbol: 'XAUTRY',
            name: 'Altın (TRY / gram)',
            iconColor: 'bg-[#ff9800]',
            currency: 'TRY / GRM'
        };
    }

    const commodityCards = [
        gold && { ...gold, name: 'Gold (USD / OZ)', iconColor: 'bg-[#ff9800]', currency: 'USD' },
        commodities.find(c => c.symbol === 'SI=F') && { ...commodities.find(c => c.symbol === 'SI=F'), name: 'Silver (USD / OZ)', iconColor: 'bg-[#9e9e9e]', currency: 'USD' },
        gramAltin,
        commodities.find(c => c.symbol === 'CL=F') && { ...commodities.find(c => c.symbol === 'CL=F'), name: 'Brent Petrol', iconColor: 'bg-[#424242]', currency: 'USD' }
    ].filter(Boolean);

    const vipCodes = ["USD", "EUR", "GBP", "CAD", "CHF", "RUB", "SAR", "JPY", "AUD", "NOK", "DKK", "SEK"];
    const sortedForexList = vipCodes.map(code => currencies.find(c => c.currencyCode === code)).filter(Boolean);

    // F. SONUÇLARI SAYFAYA DÖN (Frontend yapısı hiç değişmeliği için sayfalar bozulmaz)
    return {
        loading, indices, ipos, trBonds, globalBonds,
        globalFunds, trFunds,
        highestVolume, mostVolatile, topGainers, topLosers,
        commodityCards, sortedForexList,
        economyMacro,
        economyMetric, setEconomyMetric,
        economyRange, setEconomyRange,
        economyData, economyLoading
    };
};