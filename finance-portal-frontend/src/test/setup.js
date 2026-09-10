// Vitest global setup — her test'ten önce yüklenir.
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// React Testing Library: her test sonrası DOM'u temizle (memory leak guard)
afterEach(() => {
    cleanup();
});

// matchMedia: jsdom'da yok; recharts/tema kodu sorgu yaptığında patlamasın
if (typeof window !== 'undefined' && !window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }));
}

// ResizeObserver: bazı charts/lib'leri kullanır
if (typeof window !== 'undefined' && !window.ResizeObserver) {
    window.ResizeObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
    }));
}
