import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (k) => {
            const map = {
                'greeting.morning': 'Günaydın',
                'greeting.afternoon': 'İyi günler',
                'greeting.evening': 'İyi akşamlar',
                'greeting.night': 'İyi geceler',
                'greeting.subtitle': 'Bugün ne yapmak istersin?',
            };
            return map[k] || k;
        }
    })
}));

import DashboardGreeting from './DashboardGreeting';

describe('DashboardGreeting', () => {
    const setHour = (h) => {
        vi.useFakeTimers();
        const d = new Date();
        d.setHours(h);
        vi.setSystemTime(d);
    };

    it.each([
        [7, 'Günaydın'],
        [11, 'Günaydın'],
        [12, 'İyi günler'],
        [17, 'İyi günler'],
        [18, 'İyi akşamlar'],
        [21, 'İyi akşamlar'],
        [22, 'İyi geceler'],
        [23, 'İyi geceler'],
        [3, 'İyi geceler'],
    ])('saat %s → "%s"', (hour, expected) => {
        setHour(hour);
        render(<DashboardGreeting name="Türkbey" />);
        expect(screen.getByText(new RegExp(expected))).toBeInTheDocument();
        vi.useRealTimers();
    });

    it('name verilirse karşılamaya eklenir', () => {
        setHour(10);
        render(<DashboardGreeting name="Alice" />);
        expect(screen.getByText('Alice')).toBeInTheDocument();
        vi.useRealTimers();
    });

    it('name yoksa virgül de yok (sadece selamlama)', () => {
        setHour(10);
        const { container } = render(<DashboardGreeting name="" />);
        // ", " virgülü yok
        const greeting = container.querySelector('h1')?.textContent || '';
        expect(greeting).not.toContain(',');
    });

    it('subtitle her zaman render', () => {
        setHour(10);
        render(<DashboardGreeting name="X" />);
        expect(screen.getByText('Bugün ne yapmak istersin?')).toBeInTheDocument();
        vi.useRealTimers();
    });
});
