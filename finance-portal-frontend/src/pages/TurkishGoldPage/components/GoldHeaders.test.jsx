import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k }),
}));

import GoldHeader from './GoldHeader';
import GoldListHeader from './GoldListHeader';

describe('GoldHeader', () => {
    it('headerTitle render', () => {
        render(<GoldHeader />);
        expect(screen.getByText('gold.headerTitle')).toBeInTheDocument();
    });
});

describe('GoldListHeader', () => {
    it('3 kolon başlığı', () => {
        render(<GoldListHeader />);
        expect(screen.getByText('common:labels.asset')).toBeInTheDocument();
        expect(screen.getByText(/common:labels.buyRate/)).toBeInTheDocument();
        expect(screen.getByText('common:labels.change')).toBeInTheDocument();
    });
});
