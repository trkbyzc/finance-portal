import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';

const changeLanguage = vi.fn();
const { i18nMock } = vi.hoisted(() => ({ i18nMock: { language: 'tr', changeLanguage: vi.fn() } }));
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ i18n: i18nMock })
}));

import LanguageToggle from './LanguageToggle';

describe('LanguageToggle', () => {
    it('TR ve EN butonu render', () => {
        i18nMock.language = 'tr';
        render(<LanguageToggle />);
        expect(screen.getByText('TR')).toBeInTheDocument();
        expect(screen.getByText('EN')).toBeInTheDocument();
    });

    it('current=tr → TR aktif (aria-checked=true)', () => {
        i18nMock.language = 'tr';
        const { container } = render(<LanguageToggle />);
        const trBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'TR');
        expect(trBtn.getAttribute('aria-checked')).toBe('true');
    });

    it('current=en → EN aktif', () => {
        i18nMock.language = 'en';
        const { container } = render(<LanguageToggle />);
        const enBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'EN');
        expect(enBtn.getAttribute('aria-checked')).toBe('true');
    });

    it("en-US gibi composite locale → 'en' fallback", () => {
        i18nMock.language = 'en-US';
        const { container } = render(<LanguageToggle />);
        const enBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'EN');
        expect(enBtn.getAttribute('aria-checked')).toBe('true');
    });

    it('button click → i18n.changeLanguage(code)', () => {
        i18nMock.language = 'tr';
        i18nMock.changeLanguage = vi.fn();
        const { container } = render(<LanguageToggle />);
        const enBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'EN');
        fireEvent.click(enBtn);
        expect(i18nMock.changeLanguage).toHaveBeenCalledWith('en');
    });

    it('role="radiogroup" + accessibility attributes', () => {
        const { container } = render(<LanguageToggle />);
        expect(container.querySelector('[role="radiogroup"]')).toBeInTheDocument();
        const radios = container.querySelectorAll('[role="radio"]');
        expect(radios).toHaveLength(2);
    });
});
