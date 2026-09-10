import { apiClient } from '../../config/apiClient';

export const currencyApi = {
    getAllCurrencies: () => apiClient.get('/market-data/currencies'),
    getBankCurrencies: () => apiClient.get('/market-data/bank-currencies'),
    getCryptoRates: () => apiClient.get('/market-data/crypto-currencies'),

    // 1 birim {code}'un TRY karşılığı geçmiş günlük serisi (örn. USD → [{date, close}, ...])
    getCurrencyHistorical: (code, range = '5y') =>
        apiClient.get(`/market-data/currencies/${code}/historical`, { params: { range } })
};