import { apiClient } from '../../config/apiClient';

// Backend, lang=tr|en bekler. UI dilini varsayılan olarak alırız ama caller'lar i18n.language
// geçmek isterse override edebilir — useNewsData / NewsPage gibi yerlerde geçilir.
export const newsApi = {
    getAllNews: (lang) => apiClient.get('/news', { params: { lang } }),
    getNewsPage: (category, page, lang, size = 10) =>
        apiClient.get('/news', { params: { category, page, size, lang } }),
    getNewsContent: (url, lang) =>
        apiClient.get('/news/content', { params: { url, lang } }),
    // Bir varlığı etkileyen haberler — varlık detayındaki "İlgili Haberler" bölümü için
    getNewsBySymbol: (symbol, lang, limit = 6) =>
        apiClient.get('/news/by-symbol', { params: { symbol, limit, lang } })
};