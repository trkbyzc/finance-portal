import { apiClient } from '../../config/apiClient';

export const currencyApi = {
    getAllCurrencies: () => apiClient.get('/market-data/currencies'),
    getBankCurrencies: () => apiClient.get('/market-data/bank-currencies'),
    getCryptoRates: () => apiClient.get('/market-data/crypto-currencies')
};