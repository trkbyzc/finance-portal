import { apiClient } from '../../config/apiClient';

export const newsApi = {
    getAllNews: () => apiClient.get('/news'),
    getNewsPage: (category, page, size = 10) =>
        apiClient.get('/news', { params: { category, page, size } }),
    getNewsContent: (url) =>
        apiClient.get('/news/content', { params: { url } })
};