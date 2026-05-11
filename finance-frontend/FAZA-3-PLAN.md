# 📋 FAZA 3: SERVICE LAYER REFACTORING PLANI

## 🎯 HEDEF
Service katmanını kategorize etmek, API çağrılarını organize etmek ve eski köprü kodlarını kaldırmak.

---

## 📊 MEVCUT DURUM ANALİZİ

### Sorunlu Yapı

**`src/services/marketService.js`** (Karışık Mimari)
```javascript
// ✅ Yeni mimari (kategorize)
export const stockService = { ... };
export const currencyService = { ... };
export const commodityService = { ... };
export const bondFundService = { ... };
export const indexService = { ... };
export const economyService = { ... };

// ❌ Eski mimari (köprü - deprecated)
export const marketService = {
    getAllMarkets: async () => apiClient.get('/market-data/all'),
    getMarketsByEndpoint: async (endpoint) => apiClient.get(`/market-data${endpoint}`),
    getHistoricalData: async (symbol, range) => ...
    // ... daha fazla
};
```

**Sorunlar:**
1. İki farklı mimari aynı dosyada
2. `marketService` hala birçok yerde kullanılıyor
3. API endpoint'leri hardcoded
4. Tutarsız naming convention
5. Error handling eksik

---

## 🔧 YAPILACAK İŞLEMLER

### ADIM 1: Yeni API Klasör Yapısı Oluşturma

```
src/services/
├── api/
│   ├── stockApi.js (Hisse senetleri)
│   ├── currencyApi.js (Döviz ve kripto)
│   ├── commodityApi.js (Emtia ve altın)
│   ├── bondFundApi.js (Tahvil ve fonlar)
│   ├── indexApi.js (Endeksler ve VİOP)
│   ├── economyApi.js (Ekonomi ve halka arz)
│   ├── newsApi.js (Haberler)
│   └── index.js (Barrel export)
├── marketService.js (DEPRECATED - silinecek)
└── newsService.js (Taşınacak → api/newsApi.js)
```

---

### ADIM 2: API Dosyalarını Oluşturma

#### **1. `api/stockApi.js`**
```javascript
import { apiClient } from '../../config/apiClient';

/**
 * Hisse Senedi API İşlemleri
 * Endpoints: /market-data/stocks
 */
export const stockApi = {
    /**
     * Tüm hisse senetlerini getir (TR + US)
     * @returns {Promise<Array>} Hisse senedi listesi
     */
    getAll: () => apiClient.get('/market-data/stocks'),

    /**
     * Belirli bir hisse senedinin detayını getir
     * @param {string} symbol - Hisse senedi sembolü (örn: THYAO.IS)
     * @returns {Promise<Object>} Hisse senedi detayı
     */
    getBySymbol: (symbol) => apiClient.get(`/market-data/stocks/${symbol}`),

    /**
     * Türk hisse senetlerini filtrele
     * @returns {Promise<Array>} .IS ile biten hisseler
     */
    getTurkishStocks: async () => {
        const all = await stockApi.getAll();
        return all.filter(stock => stock.symbol?.endsWith('.IS'));
    },

    /**
     * ABD hisse senetlerini filtrele
     * @returns {Promise<Array>} .IS ile bitmeyen hisseler
     */
    getUSStocks: async () => {
        const all = await stockApi.getAll();
        return all.filter(stock => !stock.symbol?.endsWith('.IS'));
    }
};
```

#### **2. `api/currencyApi.js`**
```javascript
import { apiClient } from '../../config/apiClient';

/**
 * Döviz ve Kripto API İşlemleri
 * Endpoints: /market-data/currencies, /market-data/crypto-currencies, /market-data/bank-currencies
 */
export const currencyApi = {
    /**
     * Tüm döviz kurlarını getir (TCMB)
     * @returns {Promise<Array>} Döviz kuru listesi
     */
    getAllCurrencies: () => apiClient.get('/market-data/currencies'),

    /**
     * Banka döviz kurlarını getir
     * @returns {Promise<Array>} Banka kuru listesi
     */
    getBankCurrencies: () => apiClient.get('/market-data/bank-currencies'),

    /**
     * Kripto para kurlarını getir
     * @returns {Promise<Array>} Kripto listesi
     */
    getCryptoCurrencies: () => apiClient.get('/market-data/crypto-currencies'),

    /**
     * Belirli bir dövizin kurunu getir
     * @param {string} code - Döviz kodu (örn: USD, EUR)
     * @returns {Promise<Object>} Döviz detayı
     */
    getByCode: async (code) => {
        const all = await currencyApi.getAllCurrencies();
        return all.find(c => c.currencyCode === code);
    },

    /**
     * USD kurunu getir (sık kullanılan)
     * @returns {Promise<number>} USD/TRY kuru
     */
    getUSDRate: async () => {
        const usd = await currencyApi.getByCode('USD');
        return usd?.forexSelling || 1;
    }
};
```

#### **3. `api/commodityApi.js`**
```javascript
import { apiClient } from '../../config/apiClient';

/**
 * Emtia ve Altın API İşlemleri
 * Endpoints: /market-data/commodities, /market-data/turkish-gold
 */
export const commodityApi = {
    /**
     * Tüm emtiaları getir (Altın, Gümüş, Petrol vb.)
     * @returns {Promise<Array>} Emtia listesi
     */
    getAll: () => apiClient.get('/market-data/commodities'),

    /**
     * Kapalıçarşı altın fiyatlarını getir
     * @returns {Promise<Array>} Altın fiyat listesi
     */
    getTurkishGold: () => apiClient.get('/market-data/turkish-gold'),

    /**
     * Belirli bir emtianın fiyatını getir
     * @param {string} symbol - Emtia sembolü (örn: GC=F)
     * @returns {Promise<Object>} Emtia detayı
     */
    getBySymbol: async (symbol) => {
        const all = await commodityApi.getAll();
        return all.find(c => c.symbol === symbol);
    }
};
```

#### **4. `api/bondFundApi.js`**
```javascript
import { apiClient } from '../../config/apiClient';

/**
 * Tahvil ve Fon API İşlemleri
 * Endpoints: /market-data/tr-bonds, /market-data/bonds, /market-data/tr-funds, /market-data/funds
 */
export const bondFundApi = {
    /**
     * Türk tahvil ve bonolarını getir (EVDS)
     * @returns {Promise<Array>} Tahvil listesi
     */
    getTrBonds: async () => {
        const response = await apiClient.get('/market-data/tr-bonds');
        // EVDS servisi bazen .value içinde döndürüyor
        return response?.value || response || [];
    },

    /**
     * Global tahvilleri getir
     * @returns {Promise<Array>} Global tahvil listesi
     */
    getGlobalBonds: () => apiClient.get('/market-data/bonds'),

    /**
     * Türk yatırım fonlarını getir (TEFAS)
     * @returns {Promise<Array>} TEFAS fon listesi
     */
    getTrFunds: () => apiClient.get('/market-data/tr-funds'),

    /**
     * Global fonları getir (ETF)
     * @returns {Promise<Array>} ETF listesi
     */
    getGlobalFunds: () => apiClient.get('/market-data/funds'),

    /**
     * Belirli bir tahvilin detayını getir
     * @param {string} seriesNo - Tahvil seri no (örn: TP.TRSATR2030)
     * @returns {Promise<Object>} Tahvil detayı
     */
    getTrBondBySeriesNo: async (seriesNo) => {
        const all = await bondFundApi.getTrBonds();
        return all.find(b => b.SERI_NO === seriesNo || b.symbol === seriesNo);
    }
};
```

#### **5. `api/indexApi.js`**
```javascript
import { apiClient } from '../../config/apiClient';

/**
 * Endeks ve VİOP API İşlemleri
 * Endpoints: /market-data/indices, /market-data/viop, /market-data/futures
 */
export const indexApi = {
    /**
     * Tüm endeksleri getir (BIST, S&P500 vb.)
     * @returns {Promise<Array>} Endeks listesi
     */
    getIndices: () => apiClient.get('/market-data/indices'),

    /**
     * VİOP (Vadeli İşlem ve Opsiyon) verilerini getir
     * @returns {Promise<Array>} VİOP listesi
     */
    getViop: () => apiClient.get('/market-data/viop'),

    /**
     * Futures (Vadeli İşlem) verilerini getir
     * @returns {Promise<Array>} Futures listesi
     */
    getFutures: () => apiClient.get('/market-data/futures'),

    /**
     * VİOP historical data getir
     * @param {string} symbol - VİOP sembolü
     * @param {string} from - Başlangıç tarihi (YYYY-MM-DD)
     * @param {string} to - Bitiş tarihi (YYYY-MM-DD)
     * @returns {Promise<Array>} Historical data
     */
    getViopHistorical: (symbol, from, to) => 
        apiClient.get('/market-data/viop/historical', { 
            params: { symbol, from, to } 
        })
};
```

#### **6. `api/economyApi.js`**
```javascript
import { apiClient } from '../../config/apiClient';

/**
 * Ekonomi ve Halka Arz API İşlemleri
 * Endpoints: /market-data/ipo, /market-data/economy, /interest
 */
export const economyApi = {
    /**
     * Halka arz listesini getir
     * @returns {Promise<Array>} Halka arz listesi
     */
    getIPOs: () => apiClient.get('/market-data/ipo'),

    /**
     * Makro ekonomi verilerini getir (enflasyon, faiz vb.)
     * @returns {Promise<Object>} Ekonomi verileri
     */
    getMacroEconomy: () => apiClient.get('/market-data/economy'),

    /**
     * Belirli bir ekonomik göstergenin geçmiş verilerini getir
     * @param {string} metric - Gösterge (inflationRate, interestRate vb.)
     * @param {string} range - Zaman aralığı (1y, 5y, 10y)
     * @returns {Promise<Array>} Historical data
     */
    getHistoricalEconomy: (metric, range) =>
        apiClient.get('/market-data/economy/historical', { 
            params: { metric, range } 
        }),

    /**
     * Faiz hesaplama
     * @param {number} amount - Tutar
     * @param {number} days - Gün sayısı
     * @returns {Promise<Object>} Hesaplama sonucu
     */
    calculateInterest: (amount, days) =>
        apiClient.get('/interest/calculate', { 
            params: { amount, days } 
        })
};
```

#### **7. `api/newsApi.js`**
```javascript
import { apiClient } from '../../config/apiClient';

/**
 * Haber API İşlemleri
 * Endpoints: /news
 */
export const newsApi = {
    /**
     * Tüm haberleri getir (sayfalama ile)
     * @param {number} page - Sayfa numarası (0'dan başlar)
     * @param {number} size - Sayfa başına haber sayısı
     * @param {string} category - Kategori filtresi (opsiyonel)
     * @returns {Promise<Object>} Sayfalanmış haber listesi
     */
    getAll: (page = 0, size = 20, category = null) => {
        const params = { page, size };
        if (category) params.category = category;
        return apiClient.get('/news', { params });
    },

    /**
     * Belirli bir haberin detayını getir
     * @param {string} id - Haber ID
     * @returns {Promise<Object>} Haber detayı
     */
    getById: (id) => apiClient.get(`/news/${id}`),

    /**
     * Kategoriye göre haberleri getir
     * @param {string} category - Kategori (Borsa, Ekonomi, Kripto vb.)
     * @param {number} page - Sayfa numarası
     * @param {number} size - Sayfa başına haber sayısı
     * @returns {Promise<Object>} Filtrelenmiş haber listesi
     */
    getByCategory: (category, page = 0, size = 20) =>
        newsApi.getAll(page, size, category),

    /**
     * Son haberleri getir (ilk sayfa)
     * @param {number} limit - Haber sayısı limiti
     * @returns {Promise<Array>} Son haberler
     */
    getLatest: async (limit = 10) => {
        const response = await newsApi.getAll(0, limit);
        return response?.content || response?.data || [];
    }
};
```

#### **8. `api/historicalApi.js`** (YENİ - Ortak historical data)
```javascript
import { apiClient } from '../../config/apiClient';

/**
 * Historical Data API İşlemleri
 * Tüm asset tipleri için ortak historical data endpoint'i
 */

const INTERVAL_MAP = {
    '1d': '15m',
    '5d': '60m',
    '1w': '60m',
    '1mo': '1d',
    '3mo': '1d',
    '6mo': '1d',
    '1y': '1d',
    '5y': '1wk',
    'ytd': '1d',
    'max': '1wk'
};

export const historicalApi = {
    /**
     * Herhangi bir asset için historical data getir
     * @param {string} symbol - Asset sembolü
     * @param {string} range - Zaman aralığı (1d, 1w, 1mo, 3mo, 6mo, 1y, 5y, ytd, max)
     * @param {string} interval - Veri aralığı (opsiyonel, otomatik hesaplanır)
     * @returns {Promise<Array>} Historical data
     */
    getData: (symbol, range, interval = null) => {
        const params = {
            symbol,
            range,
            interval: interval || INTERVAL_MAP[range] || '1d'
        };
        return apiClient.get('/market-data/historical', { params });
    },

    /**
     * Custom tarih aralığı ile historical data getir
     * @param {string} symbol - Asset sembolü
     * @param {string} startDate - Başlangıç tarihi (YYYY-MM-DD)
     * @param {string} endDate - Bitiş tarihi (YYYY-MM-DD)
     * @returns {Promise<Array>} Historical data
     */
    getCustomRange: (symbol, startDate, endDate) => {
        const params = {
            symbol,
            range: 'custom',
            startDate,
            endDate,
            interval: '1d'
        };
        return apiClient.get('/market-data/historical', { params });
    },

    /**
     * Fon historical data getir (TEFAS veya Global)
     * @param {string} symbol - Fon sembolü
     * @param {string} range - Zaman aralığı
     * @param {boolean} isTefas - TEFAS fonu mu?
     * @returns {Promise<Array>} Historical data
     */
    getFundData: (symbol, range, isTefas) => {
        const endpoint = isTefas 
            ? '/market-data/tr-funds/historical'
            : '/market-data/funds/historical';
        return apiClient.get(endpoint, { params: { symbol, range } });
    }
};
```

#### **9. `api/aggregateApi.js`** (YENİ - Toplu veri)
```javascript
import { apiClient } from '../../config/apiClient';

/**
 * Aggregate (Toplu) Data API İşlemleri
 * Birden fazla kategoriyi tek seferde getir
 */
export const aggregateApi = {
    /**
     * Tüm piyasa verilerini tek seferde getir
     * @returns {Promise<Object>} Tüm kategorilerdeki veriler
     * @example
     * {
     *   indices: [...],
     *   stocks: [...],
     *   currencies: [...],
     *   crypto: [...],
     *   commodities: [...],
     *   bonds: [...],
     *   viop: [...],
     *   tr_funds: [...],
     *   global_funds: [...]
     * }
     */
    getAllMarkets: () => apiClient.get('/market-data/all'),

    /**
     * Dashboard için gerekli verileri getir
     * @returns {Promise<Object>} Dashboard verileri
     */
    getDashboardData: async () => {
        const all = await aggregateApi.getAllMarkets();
        return {
            indices: all.indices?.slice(0, 6) || [],
            stocks: all.stocks?.slice(0, 6) || [],
            currencies: all.currencies?.slice(0, 6) || [],
            crypto: all.crypto?.slice(0, 6) || []
        };
    }
};
```

#### **10. `api/index.js`** (Barrel Export)
```javascript
/**
 * API Services Barrel Export
 * Tüm API servislerini tek noktadan export et
 */

export { stockApi } from './stockApi';
export { currencyApi } from './currencyApi';
export { commodityApi } from './commodityApi';
export { bondFundApi } from './bondFundApi';
export { indexApi } from './indexApi';
export { economyApi } from './economyApi';
export { newsApi } from './newsApi';
export { historicalApi } from './historicalApi';
export { aggregateApi } from './aggregateApi';

// Backward compatibility için eski isimleri de export et
export { stockApi as stockService } from './stockApi';
export { currencyApi as currencyService } from './currencyApi';
export { commodityApi as commodityService } from './commodityApi';
export { bondFundApi as bondFundService } from './bondFundApi';
export { indexApi as indexService } from './indexApi';
export { economyApi as economyService } from './economyApi';
```

---

### ADIM 3: Mevcut Kullanımları Güncelleme

#### Güncellenecek Dosyalar

**1. Tüm Hook'lar**
```javascript
// ❌ ESKİ
import { marketService } from '../services/marketService';

// ✅ YENİ
import { aggregateApi, historicalApi } from '../services/api';
```

**2. `useLiveMarketData.js`**
```javascript
// ❌ ESKİ
import { indexService, stockService, ... } from '../services/marketService';

// ✅ YENİ
import { indexApi, stockApi, commodityApi, currencyApi, bondFundApi, economyApi } from '../services/api';

// Kullanım
const results = useQueries({
    queries: [
        { queryKey: ['indices'], queryFn: indexApi.getIndices },
        { queryKey: ['stocks'], queryFn: stockApi.getAll },
        { queryKey: ['ipos'], queryFn: economyApi.getIPOs },
        // ...
    ]
});
```

**3. `useDashboardData.js`**
```javascript
// ❌ ESKİ
import { marketService, currencyService } from '../services/marketService';

// ✅ YENİ
import { aggregateApi, currencyApi } from '../services/api';
```

**4. `useChartData.js`**
```javascript
// ❌ ESKİ
import axios from 'axios';

// ✅ YENİ
import { historicalApi } from '../../../services/api';

// Kullanım
const response = await historicalApi.getData(backendSymbol, activeRange);
```

---

### ADIM 4: marketService.js Silme

**Silinecek Dosya:**
- `src/services/marketService.js` (DEPRECATED)

**Silinecek Dosya:**
- `src/services/newsService.js` (newsApi.js'e taşındı)

---

## 📊 BEKLENEN SONUÇLAR

### Kod Organizasyonu
- ✅ Her API kendi dosyasında
- ✅ JSDoc ile dokümantasyon
- ✅ Tutarlı naming convention
- ✅ Barrel export ile kolay import

### Maintainability
- ✅ Yeni endpoint eklemek kolay
- ✅ API değişiklikleri tek yerden yönetilir
- ✅ Type safety (JSDoc ile)
- ✅ Daha iyi IDE support

### Backward Compatibility
- ✅ Eski import'lar çalışmaya devam eder
- ✅ Kademeli geçiş mümkün
- ✅ Breaking change yok

---

## ⏱️ TAHMINI SÜRE
- **ADIM 1 (Klasör yapısı):** 15 dakika
- **ADIM 2 (API dosyaları):** 2-3 saat
- **ADIM 3 (Kullanımları güncelleme):** 1-2 saat
- **ADIM 4 (Eski dosyaları silme):** 30 dakika
- **Test:** 1 saat
- **TOPLAM:** 5-7 saat

---

## ✅ BAŞARI KRİTERLERİ
1. Tüm API çağrıları çalışıyor
2. Hiçbir endpoint kaybolmadı
3. JSDoc dokümantasyonu tam
4. Backward compatibility sağlandı
5. Import'lar temiz ve tutarlı

---

**Hazırlayan:** Kiro AI  
**Tarih:** 10 Mayıs 2026  
**Durum:** 📋 PLANLANDI
