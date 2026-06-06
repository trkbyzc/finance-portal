import { apiClient } from '../../config/apiClient';

// Backend, lang=tr|en bekler. UI dilini varsayılan olarak alırız ama caller'lar i18n.language
// geçmek isterse override edebilir — useNewsData / NewsPage gibi yerlerde geçilir.
export const newsApi = {
    getAllNews: (lang) => apiClient.get('/news', { params: { lang } }),
    getNewsPage: (category, page, lang, size = 10) =>
        apiClient.get('/news', { params: { category, page, size, lang } }),
    // Cold EN call'da LibreTranslate ~10-15sn alabiliyor (default 10sn timeout yetersiz).
    // Bir kez cache'lenince <100ms; user "Article not found" görmesin diye 30sn override.
    getNewsContent: (url, lang) =>
        apiClient.get('/news/content', { params: { url, lang }, timeout: 30000 }),
    // Bir varlığı etkileyen haberler — varlık detayındaki "İlgili Haberler" bölümü için
    getNewsBySymbol: (symbol, lang, limit = 6) =>
        apiClient.get('/news/by-symbol', { params: { symbol, limit, lang } })
};