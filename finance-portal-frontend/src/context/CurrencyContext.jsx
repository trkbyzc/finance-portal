import { createContext, useContext, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { currencyApi } from '../services/api';
import { QUERY_CONFIG } from '../constants/config';
import { formatCurrency } from '../utils/formatters/currencyFormatter';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState('TRY');

    const { data: usdRate = 1 } = useQuery({
        queryKey: ['usdRate'],
        queryFn: async () => {
            const currencies = await currencyApi.getAllCurrencies();
            const usd = currencies.find(c => c.currencyCode === 'USD');
            return usd?.forexSelling || 1;
        },
        staleTime: QUERY_CONFIG.STALE_TIME.LONG,
        retry: 2
    });

    const toggleCurrency = () => {
        setCurrency(prev => prev === 'TRY' ? 'USD' : 'TRY');
    };

    const convertPrice = (price, nativeCurrency) => {
        if (!price) return 0;
        if (currency === nativeCurrency) return price; // Aynıysa dokunma
        if (currency === 'TRY' && nativeCurrency === 'USD') return price * usdRate; // Dolardan TL'ye
        if (currency === 'USD' && nativeCurrency === 'TRY') return price / usdRate; // TL'den Dolara
        return price;
    };

    // minDecimals/maxDecimals opsiyonel — portföy toplamları gibi büyük tutarlarda 2 ondalık
    // (₺49.768,01) istenir; varsayılan 2–4 birim fiyatlar için korunur.
    const formatPrice = (price, nativeCurrency = 'TRY', minDecimals = 2, maxDecimals = 4) => {
        if (price === null || price === undefined) return '-';
        const converted = convertPrice(price, nativeCurrency);
        return formatCurrency(converted, currency, minDecimals, maxDecimals);
    };

    // convertPrice'ın TERSİ: kullanıcının SEÇİLİ para biriminde girdiği değeri varlığın
    // native birimine çevirir (backend native fiyat saklar). Örn. toggle=USD, native=TRY ise
    // girilen $ değeri × usdRate ile TRY'ye çevrilir.
    const toNative = (displayValue, nativeCurrency = 'TRY') => {
        const v = Number(displayValue) || 0;
        if (currency === nativeCurrency) return v;
        if (nativeCurrency === 'TRY' && currency === 'USD') return v * usdRate; // girilen $ -> ₺
        if (nativeCurrency === 'USD' && currency === 'TRY') return v / usdRate; // girilen ₺ -> $
        return v;
    };

    // Varlığı KENDİ para biriminde gösterir (TRY/USD toggle'ından bağımsız).
    // Varlık listeleri/ekleme akışlarında her varlık kendi biriminde görünsün diye:
    // Türk varlıkları ₺, küresel (kripto, ABD hissesi vb.) $ kalır.
    const formatNative = (price, nativeCurrency = 'TRY', minDecimals = 2, maxDecimals = 4) => {
        if (price === null || price === undefined) return '-';
        return formatCurrency(price, nativeCurrency, minDecimals, maxDecimals);
    };

    const value = useMemo(
        () => ({ currency, setCurrency, toggleCurrency, usdRate, convertPrice, toNative, formatPrice, formatNative }),
        // currency + usdRate kapanışları içeren tüm fonksiyonlar bu iki state ile yenilenir
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [currency, usdRate]
    );

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);