import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { i18nMock } = vi.hoisted(() => ({ i18nMock: { language: 'tr' } }));
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ i18n: i18nMock }),
}));

const { newsApiMock } = vi.hoisted(() => ({ newsApiMock: { getNewsPage: vi.fn() } }));
vi.mock('../services/api', () => ({ newsApi: newsApiMock }));

import { useNewsData } from './useNewsData';

const makeWrap = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

const mkNews = (i) => ({ id: i, title: `Haber ${i}`, url: `https://x/${i}` });

describe('useNewsData', () => {
    beforeEach(() => {
        i18nMock.language = 'tr';
        newsApiMock.getNewsPage.mockReset();
    });

    it("array response → news + topNews + recentNews", async () => {
        const news10 = Array.from({ length: 10 }, (_, i) => mkNews(i));
        newsApiMock.getNewsPage.mockResolvedValue(news10);

        const { result } = renderHook(() => useNewsData('Borsa'), { wrapper: makeWrap() });

        await waitFor(() => expect(result.current.news).toHaveLength(10));
        expect(result.current.topNews).toHaveLength(5);
        expect(result.current.recentNews).toHaveLength(5);
        expect(newsApiMock.getNewsPage).toHaveBeenCalledWith('Borsa', 0, 'tr', 20);
    });

    it("nested response.content fallback", async () => {
        newsApiMock.getNewsPage.mockResolvedValue({ content: [mkNews(1), mkNews(2)] });
        const { result } = renderHook(() => useNewsData(), { wrapper: makeWrap() });
        await waitFor(() => expect(result.current.news).toHaveLength(2));
    });

    it("response.items fallback", async () => {
        newsApiMock.getNewsPage.mockResolvedValue({ items: [mkNews(1)] });
        const { result } = renderHook(() => useNewsData(), { wrapper: makeWrap() });
        await waitFor(() => expect(result.current.news).toHaveLength(1));
    });

    it("API hata atarsa news boş array, error null", async () => {
        newsApiMock.getNewsPage.mockRejectedValue(new Error('500'));
        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { result } = renderHook(() => useNewsData(), { wrapper: makeWrap() });

        await waitFor(() => expect(result.current.news).toEqual([]));
        expect(result.current.topNews).toEqual([]);
        errSpy.mockRestore();
    });

    it("5'ten az haber → recentNews boş", async () => {
        newsApiMock.getNewsPage.mockResolvedValue([mkNews(1), mkNews(2)]);
        const { result } = renderHook(() => useNewsData(), { wrapper: makeWrap() });
        await waitFor(() => expect(result.current.news).toHaveLength(2));
        expect(result.current.recentNews).toEqual([]);
    });

    it("EN locale → lang='en' param", async () => {
        i18nMock.language = 'en-US';
        newsApiMock.getNewsPage.mockResolvedValue([]);
        renderHook(() => useNewsData('Kripto'), { wrapper: makeWrap() });
        await waitFor(() => expect(newsApiMock.getNewsPage).toHaveBeenCalledWith('Kripto', 0, 'en', 20));
    });

    it("default category 'Tümü'", async () => {
        newsApiMock.getNewsPage.mockResolvedValue([]);
        renderHook(() => useNewsData(), { wrapper: makeWrap() });
        await waitFor(() => expect(newsApiMock.getNewsPage).toHaveBeenCalledWith('Tümü', 0, 'tr', 20));
    });
});
