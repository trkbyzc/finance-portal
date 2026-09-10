import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import StepIndicator from './StepIndicator';

describe('StepIndicator', () => {
    it('default 3 dot render eder', () => {
        const { container } = render(<StepIndicator step={1} />);
        // 3 dot + 2 connector line
        expect(container.querySelectorAll('div.rounded-full')).toHaveLength(3);
    });

    it('custom total dot sayısı', () => {
        const { container } = render(<StepIndicator step={1} total={5} />);
        expect(container.querySelectorAll('div.rounded-full')).toHaveLength(5);
    });

    it('step=1 → ilk dot primary, diğerleri surface-hover', () => {
        const { container } = render(<StepIndicator step={1} />);
        const dots = container.querySelectorAll('div.rounded-full');
        expect(dots[0].className).toContain('bg-primary');
        expect(dots[1].className).toContain('bg-surface-hover');
        expect(dots[2].className).toContain('bg-surface-hover');
    });

    it('step=2 → 1 ve 2 primary', () => {
        const { container } = render(<StepIndicator step={2} />);
        const dots = container.querySelectorAll('div.rounded-full');
        expect(dots[0].className).toContain('bg-primary');
        expect(dots[1].className).toContain('bg-primary');
        expect(dots[2].className).toContain('bg-surface-hover');
    });

    it('step=3 → hepsi primary', () => {
        const { container } = render(<StepIndicator step={3} />);
        const dots = container.querySelectorAll('div.rounded-full');
        dots.forEach(d => expect(d.className).toContain('bg-primary'));
    });

    it('dotlar arası connector line render', () => {
        const { container } = render(<StepIndicator step={2} />);
        // 3 dot için 2 connector
        const lines = container.querySelectorAll('div.w-16.h-1');
        expect(lines).toHaveLength(2);
    });

    it('numeric label dotlar içinde render', () => {
        const { getByText } = render(<StepIndicator step={1} />);
        expect(getByText('1')).toBeInTheDocument();
        expect(getByText('2')).toBeInTheDocument();
        expect(getByText('3')).toBeInTheDocument();
    });
});
