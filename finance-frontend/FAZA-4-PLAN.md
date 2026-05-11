# 📋 FAZA 4: UTILS VE CONSTANTS ORGANIZASYONU PLANI

## 🎯 HEDEF
Utility fonksiyonlarını organize etmek, constants'ları merkezi hale getirmek ve hardcoded değerleri temizlemek.

---

## 📊 MEVCUT DURUM ANALİZİ

### Mevcut Utils Yapısı
```
src/utils/
├── cryptoUtils.js
└── currencyUtils.js
```

### Sorunlar
1. **Hardcoded Values:** Kod içinde magic numbers ve strings
2. **Dağınık Utils:** Utility fonksiyonları farklı yerlerde
3. **Constants Yok:** Merkezi constants dosyası yok
4. **Formatters Karışık:** Format fonksiyonları her yerde tekrar yazılmış

### Hardcoded Değer Örnekleri
```javascript
// Kod içinde bulunabilecek hardcoded değerler:
staleTime: 60 * 1000
refetchInterval: 30 * 1000
slice(0, 6)
'http://localhost:8081/api/market-data/...'
'#2962ff'
'#131722'
```

---

## 🔧 YAPILACAK İŞLEMLER

### ADIM 1: Yeni Utils Klasör Yapısı

```
src/utils/
├── formatters/
│   ├── currencyFormatter.js (Para birimi formatları)
│   ├── dateFormatter.js (Tarih formatları)
│   ├── numberFormatter.js (Sayı formatları)
│   └── index.js (Barrel export)
├── validators/
│   ├── inputValidators.js (Input doğrulama)
│   └── index.js
├── transformers/
│   ├── chartDataTransformer.js (Chart veri dönüşümleri)
│   ├── apiDataTransformer.js (API veri dönüşümleri)
│   └── index.js
├── helpers/
│   ├── dateHelpers.js (Tarih hesaplamaları)
│   ├── mathHelpers.js (Matematiksel işlemler)
│   └── index.js
└── index.js (Ana barrel export)
```

### ADIM 2: Constants Klasörü

```
src/config/
├── apiClient.js ✅ (Zaten var)
├── customOverlays.js ✅ (Zaten var)
├── constants.js (YENİ - Genel constants)
├── colors.js (YENİ - Renk paleti)
├── apiEndpoints.js (YENİ - API endpoint'leri)
└── queryConfig.js (YENİ - React Query ayarları)
```

---

## 📝 DOSYA İÇERİKLERİ

### **1. `config/constants.js`**
```javascript
/**
 * Uygulama Geneli Sabitler
 */

// Cache süreleri (milisaniye)
export const CACHE_TIMES = {
    SHORT: 30 * 1000,      // 30 saniye
    MEDIUM: 60 * 1000,     // 1 dakika
    LONG: 5 * 60 * 1000,   // 5 dakika
    VERY_LONG: 15 * 60 * 1000, // 15 dakika
};

// Refetch interval'ları
export const REFETCH_INTERVALS = {
    TICKER: 30 * 1000,     // 30 saniye
    LIVE_DATA: 60 * 1000,  // 1 dakika
    STATIC_DATA: null,     // Refetch yok
};

// Görüntüleme limitleri
export const DISPLAY_LIMITS = {
    DASHBOARD_SHOWCASE: 6,
    TICKER_ITEMS: 10,
    NEWS_PREVIEW: 5,
    SEARCH_RESULTS: 20,
    PAGINATION_SIZE: 20,
    CRYPTO_SHOWCASE: 10,
    CURRENCY_MAJOR: 5,
    STOCK_SHOWCASE: 10,
};

// Timeout süreleri
export const TIMEOUTS = {
    API_REQUEST: 10000,    // 10 saniye
    DEBOUNCE_SEARCH: 300,  // 300ms
    TOAST_DURATION: 3000,  // 3 saniye
};

// Kripto para listesi
export const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'BNB', 'PEPE', 'SOL', 'USDT', 'XRP', 'ADA', 'DOT', 'DOGE'];

// Major dövizler
export const MAJOR_CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'RUB', 'SAR', 'JPY', 'AUD', 'NOK', 'DKK', 'SEK'];

// Global ETF'ler
export const GLOBAL_ETFS = ['SPY', 'GLD', 'TLT', 'VNQ', 'DIA', 'IWM', 'VTI', 'VOO', 'QQQ', 'IVV'];

// Chart range'leri
export const CHART_RANGES = ['1d', '5d', '1w', '1mo', '3mo', '6mo', '1y', '5y', 'ytd', 'max', 'custom'];

// Ekonomi metrikleri
export const ECONOMY_METRICS = {
    INFLATION: 'inflationRate',
    INTEREST: 'interestRate',
    UNEMPLOYMENT: 'unemploymentRate',
    GDP: 'gdpGrowth',
    EXCHANGE_RATE: 'exchangeRate'
};

// Haber kategorileri
export const NEWS_CATEGORIES = ['Tümü', 'Borsa', 'Ekonomi', 'Kripto', 'Döviz', 'Emtia', 'Dünya'];
```

### **2. `config/colors.js`**
```javascript
/**
 * Uygulama Renk Paleti
 * Tailwind CSS ile uyumlu
 */

export const COLORS = {
    // Ana renkler
    PRIMARY: '#2962ff',
    SECONDARY: '#00c853',
    DANGER: '#f23645',
    WARNING: '#fbbf24',
    INFO: '#2196f3',
    
    // Background renkler
    BG_PRIMARY: '#0b0e14',
    BG_SECONDARY: '#131722',
    BG_TERTIARY: '#1e222d',
    
    // Border renkler
    BORDER_PRIMARY: '#2a2e39',
    BORDER_SECONDARY: '#363a45',
    
    // Text renkler
    TEXT_PRIMARY: '#d1d4dc',
    TEXT_SECONDARY: '#787b86',
    TEXT_TERTIARY: '#868993',
    
    // Chart renkler
    CHART_BLUE: '#2962ff',
    CHART_GREEN: '#00c853',
    CHART_RED: '#f23645',
    CHART_YELLOW: '#fbbf24',
    CHART_PURPLE: '#9c27b0',
    CHART_ORANGE: '#ff9800',
    CHART_CYAN: '#00bcd4',
    
    // Gradient renkler
    GRADIENT_START: 'rgba(41, 98, 255, 0.4)',
    GRADIENT_END: 'rgba(41, 98, 255, 0)',
    
    // Status renkler
    SUCCESS: '#00c853',
    ERROR: '#f23645',
    LOADING: '#2962ff',
    
    // Asset kategorisi renkler
    STOCK: '#2962ff',
    CURRENCY: '#fbbf24',
    CRYPTO: '#ff9800',
    COMMODITY: '#9e9e9e',
    BOND: '#9c27b0',
    FUND: '#00bcd4',
};

// Renk utility fonksiyonları
export const getChangeColor = (changePercent) => {
    if (changePercent > 0) return COLORS.SUCCESS;
    if (changePercent < 0) return COLORS.ERROR;
    return COLORS.TEXT_SECONDARY;
};

export const getAssetColor = (assetType) => {
    const colorMap = {
        STOCK: COLORS.STOCK,
        CURRENCY: COLORS.CURRENCY,
        CRYPTO: COLORS.CRYPTO,
        COMMODITY: COLORS.COMMODITY,
        BOND: COLORS.BOND,
        FUND: COLORS.FUND,
    };
    return colorMap[assetType] || COLORS.PRIMARY;
};
```

### **3. `config/apiEndpoints.js`**
```javascript
/**
 * API Endpoint Sabitleri
 * Tüm API endpoint'leri merkezi olarak yönetilir
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';

export const API_ENDPOINTS = {
    // Market Data
    MARKET: {
        ALL: '/market-data/all',
        STOCKS: '/market-data/stocks',
        INDICES: '/market-data/indices',
        CURRENCIES: '/market-data/currencies',
        BANK_CURRENCIES: '/market-data/bank-currencies',
        CRYPTO: '/market-data/crypto-currencies',
        COMMODITIES: '/market-data/commodities',
        TURKISH_GOLD: '/market-data/turkish-gold',
        BONDS: '/market-data/bonds',
        TR_BONDS: '/market-data/tr-bonds',
        FUNDS: '/market-data/funds',
        TR_FUNDS: '/market-data/tr-funds',
        VIOP: '/market-data/viop',
        FUTURES: '/market-data/futures',
        HISTORICAL: '/market-data/historical',
    },
    
    // Economy
    ECONOMY: {
        IPO: '/market-data/ipo',
        MACRO: '/market-data/economy',
        HISTORICAL: '/market-data/economy/historical',
    },
    
    // Interest
    INTEREST: {
        CALCULATE: '/interest/calculate',
    },
    
    // News
    NEWS: {
        ALL: '/news',
        BY_ID: (id) => `/news/${id}`,
    },
};

export { BASE_URL };
```

### **4. `config/queryConfig.js`**
```javascript
/**
 * React Query Konfigürasyonu
 */

import { CACHE_TIMES, REFETCH_INTERVALS } from './constants';

export const QUERY_KEYS = {
    // Market data
    ALL_MARKETS: 'allMarkets',
    STOCKS: 'stocks',
    INDICES: 'indices',
    CURRENCIES: 'currencies',
    CRYPTO: 'crypto',
    COMMODITIES: 'commodities',
    BONDS: 'bonds',
    FUNDS: 'funds',
    VIOP: 'viop',
    
    // Historical
    HISTORICAL: 'historical',
    CHART_DATA: 'chartData',
    
    // Economy
    IPOS: 'ipos',
    ECONOMY_MACRO: 'economyMacro',
    ECONOMY_HISTORICAL: 'economyHistorical',
    
    // News
    NEWS: 'news',
    NEWS_DETAIL: 'newsDetail',
    
    // Dashboard
    DASHBOARD_TAB: 'dashboardTab',
    DASHBOARD_CURRENCIES: 'dashboardCurrencies',
    
    // Ticker
    TICKER_DATA: 'tickerData',
    
    // USD Rate
    USD_RATE: 'usdRate',
};

export const QUERY_OPTIONS = {
    // Ticker (sık güncellenen)
    TICKER: {
        staleTime: CACHE_TIMES.SHORT,
        refetchInterval: REFETCH_INTERVALS.TICKER,
        retry: 1,
    },
    
    // Live data (orta sıklıkta güncellenen)
    LIVE: {
        staleTime: CACHE_TIMES.MEDIUM,
        refetchInterval: REFETCH_INTERVALS.LIVE_DATA,
        retry: 1,
    },
    
    // Static data (nadiren güncellenen)
    STATIC: {
        staleTime: CACHE_TIMES.LONG,
        refetchInterval: REFETCH_INTERVALS.STATIC_DATA,
        retry: 2,
    },
    
    // Historical data (çok nadiren güncellenen)
    HISTORICAL: {
        staleTime: CACHE_TIMES.VERY_LONG,
        refetchInterval: REFETCH_INTERVALS.STATIC_DATA,
        retry: 1,
    },
};
```

### **5. `utils/formatters/currencyFormatter.js`**
```javascript
/**
 * Para Birimi Formatlama Fonksiyonları
 */

/**
 * Fiyatı para birimi formatında göster
 * @param {number} price - Fiyat
 * @param {string} currency - Para birimi (TRY, USD, EUR)
 * @param {number} minDecimals - Minimum ondalık basamak
 * @param {number} maxDecimals - Maksimum ondalık basamak
 * @returns {string} Formatlanmış fiyat
 */
export const formatCurrency = (price, currency = 'TRY', minDecimals = 2, maxDecimals = 4) => {
    if (price === null || price === undefined || isNaN(price)) return '-';
    
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: maxDecimals
    }).format(price);
};

/**
 * Sayıyı binlik ayraçlı göster
 * @param {number} value - Sayı
 * @param {number} decimals - Ondalık basamak sayısı
 * @returns {string} Formatlanmış sayı
 */
export const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) return '-';
    
    return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
};

/**
 * Yüzde değerini formatla
 * @param {number} percent - Yüzde değeri
 * @param {boolean} showSign - + işareti göster mi?
 * @returns {string} Formatlanmış yüzde
 */
export const formatPercent = (percent, showSign = true) => {
    if (percent === null || percent === undefined || isNaN(percent)) return '-';
    
    const sign = showSign && percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
};

/**
 * Hacim değerini kısalt (1.5M, 2.3B gibi)
 * @param {number} volume - Hacim değeri
 * @returns {string} Kısaltılmış hacim
 */
export const formatVolume = (volume) => {
    if (!volume || volume === 0) return '-';
    
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toString();
};

/**
 * Market cap formatla
 * @param {number} marketCap - Market cap değeri
 * @returns {string} Formatlanmış market cap
 */
export const formatMarketCap = (marketCap) => {
    if (!marketCap || marketCap === 0) return '-';
    
    if (marketCap >= 1e12) return `${(marketCap / 1e12).toFixed(2)} Trilyon`;
    if (marketCap >= 1e9) return `${(marketCap / 1e9).toFixed(2)} Milyar`;
    if (marketCap >= 1e6) return `${(marketCap / 1e6).toFixed(2)} Milyon`;
    return formatNumber(marketCap, 0);
};
```

### **6. `utils/formatters/dateFormatter.js`**
```javascript
/**
 * Tarih Formatlama Fonksiyonları
 */

/**
 * Tarihi Türkçe formatla
 * @param {Date|string|number} date - Tarih
 * @param {string} format - Format tipi (short, long, time)
 * @returns {string} Formatlanmış tarih
 */
export const formatDate = (date, format = 'short') => {
    if (!date) return '-';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    const options = {
        short: { day: '2-digit', month: '2-digit', year: 'numeric' },
        long: { day: 'numeric', month: 'long', year: 'numeric' },
        time: { hour: '2-digit', minute: '2-digit' },
        full: { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    };
    
    return new Intl.DateTimeFormat('tr-TR', options[format] || options.short).format(d);
};

/**
 * Relative time formatla (2 saat önce, 3 gün önce)
 * @param {Date|string|number} date - Tarih
 * @returns {string} Relative time
 */
export const formatRelativeTime = (date) => {
    if (!date) return '-';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return formatDate(d, 'short');
};

/**
 * ISO tarih string'ini YYYY-MM-DD formatına çevir
 * @param {Date|string} date - Tarih
 * @returns {string} YYYY-MM-DD formatında tarih
 */
export const toISODateString = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    return d.toISOString().split('T')[0];
};

/**
 * Array formatındaki tarihi string'e çevir [2024, 5, 10] -> "2024-05-10"
 * @param {Array} dateArray - [year, month, day]
 * @returns {string} YYYY-MM-DD formatında tarih
 */
export const arrayToDateString = (dateArray) => {
    if (!Array.isArray(dateArray) || dateArray.length < 3) return '';
    
    const [year, month, day] = dateArray;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};
```

### **7. `utils/helpers/dateHelpers.js`**
```javascript
/**
 * Tarih Hesaplama Yardımcı Fonksiyonları
 */

/**
 * Geçmiş tarih hesapla
 * @param {number} daysAgo - Kaç gün önce
 * @returns {string} YYYY-MM-DD formatında tarih
 */
export const getPastDate = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
};

/**
 * Gelecek tarih hesapla
 * @param {number} daysAhead - Kaç gün sonra
 * @returns {string} YYYY-MM-DD formatında tarih
 */
export const getFutureDate = (daysAhead) => {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date.toISOString().split('T')[0];
};

/**
 * Bugünün tarihini al
 * @returns {string} YYYY-MM-DD formatında bugünün tarihi
 */
export const getToday = () => {
    return new Date().toISOString().split('T')[0];
};

/**
 * İki tarih arasındaki gün farkını hesapla
 * @param {Date|string} date1 - İlk tarih
 * @param {Date|string} date2 - İkinci tarih
 * @returns {number} Gün farkı
 */
export const getDaysDifference = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Yılın başlangıç tarihini al (YTD için)
 * @returns {string} YYYY-01-01 formatında tarih
 */
export const getYearStart = () => {
    const year = new Date().getFullYear();
    return `${year}-01-01`;
};
```

### **8. `utils/helpers/mathHelpers.js`**
```javascript
/**
 * Matematiksel Yardımcı Fonksiyonlar
 */

/**
 * Yüzde değişim hesapla
 * @param {number} oldValue - Eski değer
 * @param {number} newValue - Yeni değer
 * @returns {number} Yüzde değişim
 */
export const calculatePercentChange = (oldValue, newValue) => {
    if (!oldValue || oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
};

/**
 * Ortalama hesapla
 * @param {Array<number>} values - Değerler dizisi
 * @returns {number} Ortalama
 */
export const calculateAverage = (values) => {
    if (!values || values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
};

/**
 * Min-Max normalizasyonu
 * @param {number} value - Değer
 * @param {number} min - Minimum değer
 * @param {number} max - Maksimum değer
 * @returns {number} 0-1 arası normalize edilmiş değer
 */
export const normalize = (value, min, max) => {
    if (max === min) return 0;
    return (value - min) / (max - min);
};

/**
 * Sayıyı belirli aralığa sınırla (clamp)
 * @param {number} value - Değer
 * @param {number} min - Minimum değer
 * @param {number} max - Maksimum değer
 * @returns {number} Sınırlanmış değer
 */
export const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
};

/**
 * Basit hareketli ortalama (SMA) hesapla
 * @param {Array<number>} values - Değerler dizisi
 * @param {number} period - Periyot
 * @returns {Array<number>} SMA değerleri
 */
export const calculateSMA = (values, period) => {
    if (!values || values.length < period) return [];
    
    const sma = [];
    for (let i = period - 1; i < values.length; i++) {
        const slice = values.slice(i - period + 1, i + 1);
        sma.push(calculateAverage(slice));
    }
    return sma;
};
```

---

## 📊 BEKLENEN SONUÇLAR

### Kod Kalitesi
- ✅ Hardcoded değerler temizlendi
- ✅ Magic numbers yok
- ✅ Merkezi constants
- ✅ Reusable utility fonksiyonları

### Maintainability
- ✅ Değişiklikler tek yerden yapılır
- ✅ Tutarlı formatlar
- ✅ JSDoc dokümantasyonu
- ✅ Test edilebilir fonksiyonlar

### Developer Experience
- ✅ IDE autocomplete desteği
- ✅ Type hints (JSDoc)
- ✅ Kolay import'lar
- ✅ Anlaşılır isimlendirme

---

## ⏱️ TAHMINI SÜRE
- **ADIM 1 (Klasör yapısı):** 30 dakika
- **ADIM 2 (Constants dosyaları):** 1-2 saat
- **ADIM 3 (Formatter'lar):** 1-2 saat
- **ADIM 4 (Helper'lar):** 1 saat
- **ADIM 5 (Kullanımları güncelleme):** 2-3 saat
- **Test:** 1 saat
- **TOPLAM:** 6-9 saat

---

## ✅ BAŞARI KRİTERLERİ
1. Hiçbir hardcoded değer kalmadı
2. Tüm formatlar tutarlı
3. Constants merkezi
4. Utility fonksiyonları test edilebilir
5. JSDoc dokümantasyonu tam

---

**Hazırlayan:** Kiro AI  
**Tarih:** 10 Mayıs 2026  
**Durum:** 📋 PLANLANDI
