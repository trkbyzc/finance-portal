import React, { createContext, useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { currencyApi } from '../services/api';
// 🚀 FAZ-4: Merkezi sabitler ve formatlayıcılar eklendi!
import { QUERY_CONFIG } from '../constants/config';
import { formatCurrency } from '../utils/formatters/currencyFormatter';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState('TRY'); // Varsayılan: TRY

    const { data: usdRate = 1 } = useQuery({
        queryKey: ['usdRate'],
        queryFn: async () => {
            const currencies = await currencyApi.getAllCurrencies();
            const usd = currencies.find(c => c.currencyCode === 'USD');
            return usd?.forexSelling || 1;
        },
        // 🚀 FAZ-4: MAGIC NUMBER GİTTİ! Merkezi config kullanılıyor.
        staleTime: QUERY_CONFIG.STALE_TIME.LONG,
        retry: 2
    });

    // ₺ -> $ veya $ -> ₺ geçişini tetikler
    const toggleCurrency = () => {
        setCurrency(prev => prev === 'TRY' ? 'USD' : 'TRY');
    };

    // Matematiksel Dönüşüm Mantığı
    const convertPrice = (price, nativeCurrency) => {
        if (!price) return 0;
        if (currency === nativeCurrency) return price; // Aynıysa dokunma
        if (currency === 'TRY' && nativeCurrency === 'USD') return price * usdRate; // Dolardan TL'ye
        if (currency === 'USD' && nativeCurrency === 'TRY') return price / usdRate; // TL'den Dolara
        return price;
    };

    // Fiyatı Simgesiyle Birlikte Şık Formatlama.
    // minDecimals/maxDecimals opsiyonel — portföy toplamları gibi büyük tutarlarda 2 ondalık
    // (₺49.768,01) istenir; varsayılan 2–4 birim fiyatlar için korunur.
    const formatPrice = (price, nativeCurrency = 'TRY', minDecimals = 2, maxDecimals = 4) => {
        if (price === null || price === undefined) return '-';
        const converted = convertPrice(price, nativeCurrency);

        // 🚀 FAZ-4: Intl.NumberFormat kalabalığı gitti, merkezi formatlayıcı geldi!
        return formatCurrency(converted, currency, minDecimals, maxDecimals);
    };

    // Varlığı KENDİ para biriminde gösterir (TRY/USD toggle'ından bağımsız).
    // Varlık listeleri/ekleme akışlarında her varlık kendi biriminde görünsün diye:
    // Türk varlıkları ₺, küresel (kripto, ABD hissesi vb.) $ kalır.
    const formatNative = (price, nativeCurrency = 'TRY', minDecimals = 2, maxDecimals = 4) => {
        if (price === null || price === undefined) return '-';
        return formatCurrency(price, nativeCurrency, minDecimals, maxDecimals);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, toggleCurrency, usdRate, convertPrice, formatPrice, formatNative }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);