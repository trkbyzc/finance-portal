import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { historyMock } = vi.hoisted(() => ({
    historyMock: { getData: vi.fn(), getCustomRange: vi.fn() },
}));
vi.mock('../../services/api', () => ({ historicalApi: historyMock }));
vi.mock('../../constants/config', () => ({ QUERY_CONFIG: { STALE_TIME: { DEFAULT: 30_000 } } }));

import { useChartData } from './useChartData';
import { useFundChartData } from './useFundChartData';
import { useViopChartData, getPastDate } from './useViopChartData';

const wrap = () => {
    const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }) => <QueryClientProvider client={c}>{children}</QueryClientProvider>;
};

beforeEach(() => {
    historyMock.getData.mockReset();
    historyMock.getCustomRange.mockReset();
});

describe('useChartData', () => {
    it('isNone=true → enabled false → query çalışmaz', () => {
        renderHook(() => useChartData('AAPL', 'STOCK', '1d', null, null, true), { wrapper: wrap() });
        expect(historyMock.getData).not.toHaveBeenCalled();
    });

    it('backendSymbol yok → query çalışmaz', () => {
        renderHook(() => useChartData('', 'STOCK', '1d'), { wrapper: wrap() });
        expect(historyMock.getData).not.toHaveBeenCalled();
    });

    it('1d → interval=15m, range=1d', async () => {
        historyMock.getData.mockResolvedValue([]);
        renderHook(() => useChartData('AAPL', 'STOCK', '1d'), { wrapper: wrap() });
        await waitFor(() => expect(historyMock.getData).toHaveBeenCalledWith(expect.objectContaining({
            symbol: 'AAPL', range: '1d', interval: '15m'
        })));
    });

    it('Türkçe 1A → interval=1d, range=1mo', async () => {
        historyMock.getData.mockResolvedValue([]);
        renderHook(() => useChartData('X', 'CRYPTO', '1A'), { wrapper: wrap() });
        await waitFor(() => expect(historyMock.getData).toHaveBeenCalledWith(expect.objectContaining({
            range: '1mo', interval: '1d'
        })));
    });

    it('5y → interval=1wk', async () => {
        historyMock.getData.mockResolvedValue([]);
        renderHook(() => useChartData('X', 'STOCK', '5y'), { wrapper: wrap() });
        await waitFor(() => expect(historyMock.getData).toHaveBeenCalledWith(expect.objectContaining({
            interval: '1wk'
        })));
    });

    it('custom → getCustomRange çağrılır', async () => {
        historyMock.getCustomRange.mockResolvedValue([]);
        renderHook(() => useChartData('X', 'STOCK', 'custom', '2026-01-01', '2026-06-01'), { wrapper: wrap() });
        await waitFor(() => expect(historyMock.getCustomRange).toHaveBeenCalled());
    });

    it('transform — close ↔ price ↔ value fallback, sort by timestamp', async () => {
        historyMock.getData.mockResolvedValue([
            { date: '2026-02-01', price: 200 },
            { date: '2026-01-01', value: 100 },
        ]);
        const { result } = renderHook(() => useChartData('X', 'STOCK', '1d'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.data?.length).toBe(2));
        expect(result.current.data[0].close).toBe(100);
        expect(result.current.data[1].close).toBe(200);
    });

    it('transform — date array [Y,M,D] → ISO', async () => {
        historyMock.getData.mockResolvedValue([
            { date: [2026, 1, 5], close: 50 },
        ]);
        const { result } = renderHook(() => useChartData('X', 'STOCK', '1d'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.data?.[0].dateStr).toBe('2026-01-05'));
    });

    it('priceData wrapping', async () => {
        historyMock.getData.mockResolvedValue({ priceData: [{ date: '2026-01-01', close: 1 }] });
        const { result } = renderHook(() => useChartData('X', 'STOCK', '1d'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.data?.length).toBe(1));
    });
});

describe('useFundChartData', () => {
    it('symbol yok → query çalışmaz', () => {
        renderHook(() => useFundChartData('', '1y'), { wrapper: wrap() });
        expect(historyMock.getData).not.toHaveBeenCalled();
    });

    it('TR_FUND category ile çağrılır', async () => {
        historyMock.getData.mockResolvedValue([]);
        renderHook(() => useFundChartData('FNDX', '1y'), { wrapper: wrap() });
        await waitFor(() => expect(historyMock.getData).toHaveBeenCalledWith(expect.objectContaining({
            category: 'TR_FUND', symbol: 'FNDX', range: '1y'
        })));
    });

    it('rawData null → boş array (warn)', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        historyMock.getData.mockResolvedValue(null);
        const { result } = renderHook(() => useFundChartData('X', '1y'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.data).toEqual([]));
        warnSpy.mockRestore();
    });

    it('item.date string ISO → split T', async () => {
        historyMock.getData.mockResolvedValue([
            { date: '2026-01-05T00:00:00Z', close: 1 },
        ]);
        const { result } = renderHook(() => useFundChartData('X', '1y'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.data?.[0].dateStr).toBe('2026-01-05'));
    });
});

describe('useViopChartData', () => {
    it('symbol yok → query çalışmaz', () => {
        renderHook(() => useViopChartData('', null, null, '1mo'), { wrapper: wrap() });
        expect(historyMock.getData).not.toHaveBeenCalled();
    });

    it('VIOP category ile çağrılır + interval=1d', async () => {
        historyMock.getData.mockResolvedValue([]);
        renderHook(() => useViopChartData('F_XU030', null, null, '3mo'), { wrapper: wrap() });
        await waitFor(() => expect(historyMock.getData).toHaveBeenCalledWith(expect.objectContaining({
            category: 'VIOP', range: '3mo', interval: '1d'
        })));
    });

    it('OHLC fallback close → open/high/low', async () => {
        historyMock.getData.mockResolvedValue([{ date: '2026-01-01', close: 5 }]);
        const { result } = renderHook(() => useViopChartData('X', null, null, '1mo'), { wrapper: wrap() });
        await waitFor(() => expect(result.current.data?.length).toBe(1));
        expect(result.current.data[0].open).toBe(5);
        expect(result.current.data[0].high).toBe(5);
    });
});

describe('getPastDate', () => {
    it('30 gün önce → ISO date format', () => {
        const d = getPastDate(30);
        expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});
