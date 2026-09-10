import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k }),
}));

import InterestHeader from './InterestHeader';

describe('InterestHeader', () => {
    it('title + subtitle + bestRate badge render', () => {
        render(<InterestHeader />);
        expect(screen.getByText('pageTitle')).toBeInTheDocument();
        expect(screen.getByText('pageSubtitle')).toBeInTheDocument();
        expect(screen.getByText('results.bestRate')).toBeInTheDocument();
    });
});
