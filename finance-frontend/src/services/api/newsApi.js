import { apiClient } from '../../config/apiClient';

// Backend, lang=tr|en bekler. UI dilini varsayılan olarak alırız ama caller'lar i18n.language
// geçmek isterse override edebilir — useNewsData / NewsPage gibi yerlerde geçilir.
export const newsApi = {
    getAllNews: (lang) => apiClient.get('/news', { params: { lang } }),
    getNewsPage: (category, page, size = 10, lang) =>
        apiClient.get('/news', { params: { category, page, size, lang } }),
    getNewsContent: (url, lang) =>
        apiClient.get('/news/content', { params: { url, lang } })
};