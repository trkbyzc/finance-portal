import { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
    indexApi, stockApi, commodityApi,
    currencyApi, bondFundApi, economyApi
} from '../services/api';

export const useLiveMarketData = () => {
    // A. EKONOMİ STATE MANTIKLARI
    const [economyMetric, setEconomyMetric] = useState('inflationRate');
    const [economyRange, setEconomyRange] = useState('10y');

    // B. REACT QUERY
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

    const loading = results.some(result => result.isLoading);

    const [
        indicesRes, stocksRes, iposRes, commoditiesRes, currenciesRes,
        trBondsRes, globalBondsRes, globalFundsRes, trFundsRes, economyMacroRes
    ] = results;

    const indices = indicesRes.data || [];
    const stocks = stocksRes.data || [];
    const ipos = iposRes.data || [];
    const commodities = commoditiesRes.data || [];
    const currencies = currenciesRes.data || [];
    const trBonds = trBondsRes.data?.value || trBondsRes.data || [];
    const globalBonds = globalBondsRes.data || [];
    const globalFunds = globalFundsRes.data || [];
    const trFunds = trFundsRes.data || [];
    const economyMacro = economyMacroRes.data || null;

    const { data: economyData = [], isLoading: economyLoading } = useQuery({
        queryKey: ['economyHistorical', economyMetric, economyRange],
        queryFn: () => economyApi.getHistoricalEconomy(economyMetric, economyRange)
    });

    // E. BUSINESS LOGIC
    const turkishStocks = stocks.filter(stock => stock.symbol && stock.symbol.endsWith('.IS'));
    const highestVolume = [...turkishStocks].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 5);
    const mostVolatile = [...turkishStocks].sort((a, b) => Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0)).slice(0, 5);
    const topGainers = [...turkishStocks].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)).slice(0, 5);
    const topLosers = [...turkishStocks].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0)).slice(0, 5);

    // 🚀 TERTEMİZ KART OLUŞTURMA: Manuel matematik yok, backend'den al bas!
    const commodityCards = [
        // 1. GLOBAL ONS ALTIN
        commodities.find(c => c.symbol === 'GC=F') && {
            ...commodities.find(c => c.symbol === 'GC=F'),
            name: 'Gold (USD / OZ)',
            iconColor: 'bg-[#ff9800]',
            currency: 'USD'
        },
        // 2. GÜMÜŞ
        commodities.find(c => c.symbol === 'SI=F') && {
            ...commodities.find(c => c.symbol === 'SI=F'),
            name: 'Silver (USD / OZ)',
            iconColor: 'bg-[#9e9e9e]',
            currency: 'USD'
        },
        // 3. GRAM ALTIN (Trunçgil 'GRAM' döner, Yedek servis 'XAU_TRY_CALC' döner)
        (commodities.find(c => c.symbol === 'GRAM') || commodities.find(c => c.symbol === 'XAU_TRY_CALC')) && {
            ...(commodities.find(c => c.symbol === 'GRAM') || commodities.find(c => c.symbol === 'XAU_TRY_CALC')),
            name: 'Altın (TRY / gram)',
            iconColor: 'bg-[#ff9800]',
            currency: 'TRY / GRM'
        },
        // 4. BRENT PETROL
        commodities.find(c => c.symbol === 'CL=F') && {
            ...commodities.find(c => c.symbol === 'CL=F'),
            name: 'Brent Petrol',
            iconColor: 'bg-[#424242]',
            currency: 'USD'
        }
    ].filter(Boolean);

    const vipCodes = ["USD", "EUR", "GBP", "CAD", "CHF", "RUB", "SAR", "JPY", "AUD", "NOK", "DKK", "SEK"];
    const sortedForexList = vipCodes.map(code => currencies.find(c => c.currencyCode === code)).filter(Boolean);

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