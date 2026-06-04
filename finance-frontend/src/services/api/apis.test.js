import { describe, it, expect, vi, beforeEach } from 'vitest';

// Trivial API client'lar — hepsi apiClient (axios) wrap'ler.
// Tek mock'la hepsini birlikte test ederiz; coverage'a hızlı katkı yapar.
vi.mock('../../config/apiClient', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

import { apiClient } from '../../config/apiClient';
import { userApi } from './userApi';
import { portfolioApi } from './portfolioApi';
import { watchlistApi } from './watchlistApi';
import { newsApi } from './newsApi';
import { preferencesApi } from './preferencesApi';
import { savedChartApi } from './savedChartApi';
import { simulationApi } from './simulationApi';
import { adminApi } from './adminApi';
import { aggregateApi } from './aggregateApi';
import { bondFundApi } from './bondFundApi';
import { commodityApi } from './commodityApi';
import { currencyApi } from './currencyApi';
import { economicCalendarApi } from './economicCalendarApi';
import { economyApi } from './economyApi';
import { historicalApi } from './historicalApi';
import { indexApi } from './indexApi';
import { stockApi } from './stockApi';
import { whatIfApi } from './whatIfApi';

beforeEach(() => vi.clearAllMocks());

describe('userApi', () => {
    it('getMyProfile → GET /users/me', () => {
        userApi.getMyProfile();
        expect(apiClient.get).toHaveBeenCalledWith('/users/me');
    });
    it('get2FAStatus → GET /users/me/2fa', () => {
        userApi.get2FAStatus();
        expect(apiClient.get).toHaveBeenCalledWith('/users/me/2fa');
    });
    it('set2FA → PUT with params', () => {
        userApi.set2FA(true);
        expect(apiClient.put).toHaveBeenCalledWith('/users/me/2fa', null, { params: { enabled: true } });
    });
    it('getEmailNotifications → GET', () => {
        userApi.getEmailNotifications();
        expect(apiClient.get).toHaveBeenCalledWith('/users/me/email-notifications');
    });
    it('setEmailNotifications → PUT with params', () => {
        userApi.setEmailNotifications(false);
        expect(apiClient.put).toHaveBeenCalledWith('/users/me/email-notifications', null, { params: { enabled: false } });
    });
    it('changePassword → POST body', () => {
        userApi.changePassword('o', 'n');
        expect(apiClient.post).toHaveBeenCalledWith('/users/me/password', { oldPassword: 'o', newPassword: 'n' });
    });
});

describe('portfolioApi', () => {
    it('getPortfolios → GET /portfolio/list', () => {
        portfolioApi.getPortfolios();
        expect(apiClient.get).toHaveBeenCalledWith('/portfolio/list');
    });
    it('createPortfolio → POST', () => {
        portfolioApi.createPortfolio('Yeni');
        expect(apiClient.post).toHaveBeenCalledWith('/portfolio/list', { name: 'Yeni' });
    });
    it('renamePortfolio → PUT', () => {
        portfolioApi.renamePortfolio('id1', 'NewName');
        expect(apiClient.put).toHaveBeenCalledWith('/portfolio/list/id1', { name: 'NewName' });
    });
    it('deletePortfolio → DELETE', () => {
        portfolioApi.deletePortfolio('id2');
        expect(apiClient.delete).toHaveBeenCalledWith('/portfolio/list/id2');
    });
    it('getMyPortfolio with portfolioId param', () => {
        portfolioApi.getMyPortfolio('pid');
        expect(apiClient.get).toHaveBeenCalledWith('/portfolio/me', { params: { portfolioId: 'pid' } });
    });
    it('getMyPortfolio without → empty params', () => {
        portfolioApi.getMyPortfolio(null);
        expect(apiClient.get).toHaveBeenCalledWith('/portfolio/me', { params: {} });
    });
    it('getPortfolioSummary with id', () => {
        portfolioApi.getPortfolioSummary('p1');
        expect(apiClient.get).toHaveBeenCalledWith('/portfolio/summary', { params: { portfolioId: 'p1' } });
    });
    it('addManualEntry mapper averagePrice → price', () => {
        portfolioApi.addManualEntry({
            symbol: 'BTC', assetType: 'CRYPTO', quantity: 1, averagePrice: 100, contractSize: 1, portfolioId: 'p'
        });
        expect(apiClient.post).toHaveBeenCalledWith('/portfolio/add', {
            symbol: 'BTC', assetType: 'CRYPTO', quantity: 1, price: 100, contractSize: 1, portfolioId: 'p'
        });
    });
});

describe('watchlistApi', () => {
    it('getMyWatchlist → GET', () => {
        watchlistApi.getMyWatchlist();
        expect(apiClient.get).toHaveBeenCalledWith('/watchlist/me');
    });
    it('addToWatchlist → POST body', () => {
        watchlistApi.addToWatchlist({ symbol: 'X', assetType: 'STOCK' });
        expect(apiClient.post).toHaveBeenCalledWith('/watchlist/add', { symbol: 'X', assetType: 'STOCK' });
    });
    it('removeFromWatchlist → DELETE by id', () => {
        watchlistApi.removeFromWatchlist('w1');
        expect(apiClient.delete).toHaveBeenCalledWith('/watchlist/remove/w1');
    });
});

describe('newsApi', () => {
    it('getAllNews lang param', () => {
        newsApi.getAllNews('tr');
        expect(apiClient.get).toHaveBeenCalledWith('/news', { params: { lang: 'tr' } });
    });
    it('getNewsPage çoklu param', () => {
        newsApi.getNewsPage('CRYPTO', 2, 'en', 20);
        expect(apiClient.get).toHaveBeenCalledWith('/news', {
            params: { category: 'CRYPTO', page: 2, size: 20, lang: 'en' }
        });
    });
    it('getNewsPage default size=10', () => {
        newsApi.getNewsPage('ALL', 1);
        expect(apiClient.get).toHaveBeenCalledWith('/news', {
            params: { category: 'ALL', page: 1, size: 10, lang: undefined }
        });
    });
    it('getNewsContent url + lang', () => {
        newsApi.getNewsContent('http://x', 'tr');
        expect(apiClient.get).toHaveBeenCalledWith('/news/content', { params: { url: 'http://x', lang: 'tr' } });
    });
});

describe('preferencesApi', () => {
    it('getMyPreferences → GET', () => {
        preferencesApi.getMyPreferences();
        expect(apiClient.get).toHaveBeenCalledWith('/users/me/preferences');
    });
    it('updateMyPreferences → PUT bulk body', () => {
        preferencesApi.updateMyPreferences({ tickers: [{ symbol: 'BTC' }], tickerScope: 'HOME_ONLY' });
        expect(apiClient.put).toHaveBeenCalledWith('/users/me/preferences',
            { tickers: [{ symbol: 'BTC' }], tickerScope: 'HOME_ONLY' });
    });
});

describe('savedChartApi', () => {
    it('getMyCharts → GET', () => {
        savedChartApi.getMyCharts();
        expect(apiClient.get).toHaveBeenCalledWith('/charts/me');
    });
    it('getChart → GET by id', () => {
        savedChartApi.getChart('c1');
        expect(apiClient.get).toHaveBeenCalledWith('/charts/c1');
    });
    it('createChart → POST', () => {
        savedChartApi.createChart({ symbol: 'BTC', assetCategory: 'CRYPTO', name: 'My', payload: '{}' });
        expect(apiClient.post).toHaveBeenCalledWith('/charts',
            { symbol: 'BTC', assetCategory: 'CRYPTO', name: 'My', payload: '{}' });
    });
    it('updateChart → PUT', () => {
        savedChartApi.updateChart('c2', { name: 'X', assetCategory: 'STOCK', payload: '{}' });
        expect(apiClient.put).toHaveBeenCalledWith('/charts/c2',
            { name: 'X', assetCategory: 'STOCK', payload: '{}' });
    });
    it('deleteChart → DELETE', () => {
        savedChartApi.deleteChart('c3');
        expect(apiClient.delete).toHaveBeenCalledWith('/charts/c3');
    });
});

describe('simulationApi', () => {
    it('getMySimulations → GET', () => {
        simulationApi.getMySimulations();
        expect(apiClient.get).toHaveBeenCalledWith('/simulation/me');
    });
    it('previewSimulation → POST', () => {
        simulationApi.previewSimulation({ a: 1 });
        expect(apiClient.post).toHaveBeenCalledWith('/simulation/preview', { a: 1 });
    });
    it('createSimulation → POST', () => {
        simulationApi.createSimulation({ x: 2 });
        expect(apiClient.post).toHaveBeenCalledWith('/simulation', { x: 2 });
    });
    it('deleteSimulation → DELETE', () => {
        simulationApi.deleteSimulation('s1');
        expect(apiClient.delete).toHaveBeenCalledWith('/simulation/s1');
    });
    it('getEarliestDate → GET with encoded query', () => {
        simulationApi.getEarliestDate('A B', 'STOCK');
        expect(apiClient.get).toHaveBeenCalledWith('/simulation/earliest-date?symbol=A%20B&assetType=STOCK');
    });
});

describe('adminApi', () => {
    it('getUsers boş params → /admin/users (no qs)', () => {
        adminApi.getUsers();
        expect(apiClient.get).toHaveBeenCalledWith('/admin/users', { timeout: 30000 });
    });
    it('getUsers tüm filtreler', () => {
        adminApi.getUsers({ q: 'a', role: 'ADMIN', banned: true, page: 1, size: 50 });
        expect(apiClient.get).toHaveBeenCalledWith(
            '/admin/users?q=a&role=ADMIN&banned=true&page=1&size=50',
            { timeout: 30000 }
        );
    });
    it('banUser → POST with days', () => {
        adminApi.banUser('u1', 7);
        expect(apiClient.post).toHaveBeenCalledWith('/admin/users/u1/ban?days=7', null, { timeout: 30000 });
    });
    it('banPermanent → POST', () => {
        adminApi.banPermanent('u2');
        expect(apiClient.post).toHaveBeenCalledWith('/admin/users/u2/ban-permanent', null, { timeout: 30000 });
    });
    it('unbanUser → POST', () => {
        adminApi.unbanUser('u3');
        expect(apiClient.post).toHaveBeenCalledWith('/admin/users/u3/unban', null, { timeout: 30000 });
    });
});

describe('aggregateApi', () => {
    it('getAllMarkets → GET /market-data/all', () => {
        aggregateApi.getAllMarkets();
        expect(apiClient.get).toHaveBeenCalledWith('/market-data/all');
    });
    it('getMarketsByEndpoint → GET /market-data{endpoint}', () => {
        aggregateApi.getMarketsByEndpoint('/stocks');
        expect(apiClient.get).toHaveBeenCalledWith('/market-data/stocks');
    });
});

describe('bondFundApi', () => {
    it.each([
        ['getTrBonds', '/market-data/tr-bonds'],
        ['getTrBondsCatalog', '/market-data/tr-bonds/catalog'],
        ['getGlobalBonds', '/market-data/bonds'],
        ['getTrFunds', '/market-data/tr-funds'],
        ['getGlobalFunds', '/market-data/global-funds'],
        ['getEurobondList', '/market-data/eurobonds'],
    ])('%s → %s', (fn, url) => {
        bondFundApi[fn]();
        expect(apiClient.get).toHaveBeenCalledWith(url);
    });
});

describe('commodityApi', () => {
    it.each([
        ['getAllCommodities', '/market-data/commodities'],
        ['getTurkishGold', '/market-data/turkish-gold'],
    ])('%s → %s', (fn, url) => {
        commodityApi[fn]();
        expect(apiClient.get).toHaveBeenCalledWith(url);
    });
});

describe('currencyApi', () => {
    it.each([
        ['getAllCurrencies', '/market-data/currencies'],
        ['getBankCurrencies', '/market-data/bank-currencies'],
        ['getCryptoRates', '/market-data/crypto-currencies'],
    ])('%s → %s', (fn, url) => {
        currencyApi[fn]();
        expect(apiClient.get).toHaveBeenCalledWith(url);
    });
    it('getCurrencyHistorical default range 5y', () => {
        currencyApi.getCurrencyHistorical('USD');
        expect(apiClient.get).toHaveBeenCalledWith('/market-data/currencies/USD/historical', { params: { range: '5y' } });
    });
    it('getCurrencyHistorical custom range', () => {
        currencyApi.getCurrencyHistorical('EUR', '10y');
        expect(apiClient.get).toHaveBeenCalledWith('/market-data/currencies/EUR/historical', { params: { range: '10y' } });
    });
});

describe('economicCalendarApi', () => {
    it('getEvents boş param', () => {
        economicCalendarApi.getEvents();
        expect(apiClient.get).toHaveBeenCalledWith('/economic-calendar', { params: {} });
    });
    it('getEvents filtreler', () => {
        economicCalendarApi.getEvents({ from: '2026-01-01', countries: 'US,TR', minImpact: 'HIGH' });
        expect(apiClient.get).toHaveBeenCalledWith('/economic-calendar', {
            params: { from: '2026-01-01', countries: 'US,TR', minImpact: 'HIGH' }
        });
    });
});

describe('economyApi', () => {
    it.each([
        ['getHalkaArz', '/market-data/ipo'],
        ['getMacroEconomy', '/market-data/economy'],
        ['getIndicators', '/market-data/economy/indicators'],
    ])('%s → %s', (fn, url) => {
        economyApi[fn]();
        expect(apiClient.get).toHaveBeenCalledWith(url);
    });

    it('getHistoricalEconomy metric+range', () => {
        economyApi.getHistoricalEconomy('inflationRate', '1y');
        expect(apiClient.get).toHaveBeenCalledWith('/market-data/economy/historical',
            { params: { metric: 'inflationRate', range: '1y' } });
    });
    it('getCumulativeInflation → cumulativeInflationRate metric', () => {
        economyApi.getCumulativeInflation('5y');
        expect(apiClient.get).toHaveBeenCalledWith('/market-data/economy/historical',
            { params: { metric: 'cumulativeInflationRate', range: '5y' } });
    });
    it('getEconomyUsHistorical → usdInflationRate metric', () => {
        economyApi.getEconomyUsHistorical('10y');
        expect(apiClient.get).toHaveBeenCalledWith('/market-data/economy-us/historical',
            { params: { metric: 'usdInflationRate', range: '10y' } });
    });
    it('calculateInterest → /interest/calculate', () => {
        economyApi.calculateInterest(1000, 30);
        expect(apiClient.get).toHaveBeenCalledWith('/interest/calculate', { params: { amount: 1000, days: 30 } });
    });
});

describe('historicalApi', () => {
    it('getData → /market-data/historical params', () => {
        historicalApi.getData({ symbol: 'X', range: '1y', interval: '1d' });
        expect(apiClient.get).toHaveBeenCalledWith('/market-data/historical',
            { params: { symbol: 'X', range: '1y', interval: '1d' } });
    });
    it('getCustomRange → range=custom, interval=1d eklenir', () => {
        historicalApi.getCustomRange({ symbol: 'X', startDate: '2026-01-01', endDate: '2026-02-01' });
        expect(apiClient.get).toHaveBeenCalledWith('/market-data/historical',
            { params: { symbol: 'X', startDate: '2026-01-01', endDate: '2026-02-01', range: 'custom', interval: '1d' } });
    });
});

describe('indexApi', () => {
    it.each([
        ['getIndices', '/market-data/indices'],
        ['getViop', '/market-data/viop'],
        ['getFutures', '/market-data/futures'],
    ])('%s → %s', (fn, url) => {
        indexApi[fn]();
        expect(apiClient.get).toHaveBeenCalledWith(url);
    });
});

describe('stockApi', () => {
    it('getAllStocks → /market-data/stocks', () => {
        stockApi.getAllStocks();
        expect(apiClient.get).toHaveBeenCalledWith('/market-data/stocks');
    });
});

describe('whatIfApi', () => {
    it('compare → POST body', () => {
        whatIfApi.compare({ a: 1 });
        expect(apiClient.post).toHaveBeenCalledWith('/what-if/compare', { a: 1 });
    });
});
