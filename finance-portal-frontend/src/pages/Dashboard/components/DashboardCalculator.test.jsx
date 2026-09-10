import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k })
}));

import DashboardCalculator from './DashboardCalculator';

const defaultProps = {
    calcAmount: 100,
    setCalcAmount: () => {},
    calcCurrency: 'USD',
    setCalcCurrency: () => {},
    calculatedResult: '3.245,00',
    usdRate: 32.45,
};

describe('DashboardCalculator', () => {
    it('başlık + amount input + result render', () => {
        render(<DashboardCalculator {...defaultProps} />);
        expect(screen.getByText('calculator.title')).toBeInTheDocument();
        expect(screen.getByText('calculator.amount')).toBeInTheDocument();
        expect(screen.getByText('3.245,00')).toBeInTheDocument();
    });

    it('amount input value gösterir', () => {
        const { container } = render(<DashboardCalculator {...defaultProps} />);
        const input = container.querySelector('input[type="number"]');
        expect(input.value).toBe('100');
    });

    it('amount değişimi → setCalcAmount(value)', () => {
        const setCalcAmount = vi.fn();
        const { container } = render(<DashboardCalculator {...defaultProps} setCalcAmount={setCalcAmount} />);
        const input = container.querySelector('input[type="number"]');
        fireEvent.change(input, { target: { value: '500' } });
        expect(setCalcAmount).toHaveBeenCalledWith('500');
    });

    it('USD ve EUR currency butonu render', () => {
        const { container } = render(<DashboardCalculator {...defaultProps} />);
        const buttons = container.querySelectorAll('button');
        const labels = Array.from(buttons).map(b => b.textContent);
        expect(labels).toContain('USD');
        expect(labels).toContain('EUR');
    });

    it('aktif currency → primary border', () => {
        const { container } = render(<DashboardCalculator {...defaultProps} calcCurrency="USD" />);
        const buttons = container.querySelectorAll('button');
        const usdBtn = Array.from(buttons).find(b => b.textContent === 'USD');
        expect(usdBtn.className).toContain('bg-primary/15');
    });

    it('EUR butonuna tık → setCalcCurrency("EUR")', () => {
        const setCalcCurrency = vi.fn();
        const { container } = render(<DashboardCalculator {...defaultProps} setCalcCurrency={setCalcCurrency} />);
        const eurBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'EUR');
        fireEvent.click(eurBtn);
        expect(setCalcCurrency).toHaveBeenCalledWith('EUR');
    });

    it('usdRate=0 → loading overlay görünür', () => {
        const { container } = render(<DashboardCalculator {...defaultProps} usdRate={0} />);
        expect(container.innerHTML).toContain('backdrop-blur-sm');
    });

    it('usdRate>0 → loading overlay yok', () => {
        const { container } = render(<DashboardCalculator {...defaultProps} usdRate={32.45} />);
        // Overlay yok (animate-pulse class'lı div yok)
        const overlay = container.querySelector('.animate-pulse');
        expect(overlay).toBeNull();
    });
});
