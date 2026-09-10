import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k, fb) => fb ?? k })
}));

import ScrollToTopButton from './ScrollToTopButton';

describe('ScrollToTopButton', () => {
    beforeEach(() => {
        globalThis.scrollY = 0;
        globalThis.scrollTo = vi.fn();
    });

    it("300px altında scroll'da gizli (pointer-events-none)", () => {
        const { container } = render(<ScrollToTopButton />);
        expect(container.querySelector('button').className).toContain('opacity-0');
    });

    it("300px üstüne scroll edilince görünür hale gelir", () => {
        const { container } = render(<ScrollToTopButton />);
        act(() => {
            globalThis.scrollY = 500;
            globalThis.dispatchEvent(new Event('scroll'));
        });
        expect(container.querySelector('button').className).toContain('opacity-100');
    });

    it('click → window.scrollTo({ top: 0, behavior: smooth })', () => {
        const { container } = render(<ScrollToTopButton />);
        fireEvent.click(container.querySelector('button'));
        expect(globalThis.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('aria-label set ediliyor', () => {
        const { container } = render(<ScrollToTopButton />);
        expect(container.querySelector('button').getAttribute('aria-label')).toBe('Başa Dön');
    });
});
