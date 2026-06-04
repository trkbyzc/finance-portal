import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../utils/formatters/dateFormatter', () => ({
    formatDateTime: (d) => `DT:${d}`,
}));
vi.mock('../../../components/news/NewsAssetChip', () => ({
    default: ({ item }) => <span data-testid="chip">{item.relatedSymbol || 'no-chip'}</span>,
}));

import NewsCard from './NewsCard';

const baseItem = {
    title: 'Başlık',
    description: 'Açıklama',
    category: 'Borsa',
    pubDate: '2026-06-01',
    source: 'TestKanal',
    imageUrl: 'http://x/y.jpg',
    relatedSymbol: 'THYAO',
};

describe('NewsCard', () => {
    it('render — başlık + kategori + source', () => {
        render(<NewsCard item={baseItem} isVerified onClick={() => {}} />);
        expect(screen.getByText('Başlık')).toBeInTheDocument();
        expect(screen.getByText('Borsa')).toBeInTheDocument();
        expect(screen.getByText('TestKanal')).toBeInTheDocument();
    });

    it('isVerified=false → image div YOK', () => {
        const { container } = render(<NewsCard item={baseItem} isVerified={false} onClick={() => {}} />);
        expect(container.querySelector('.bg-cover')).toBeNull();
    });

    it('isVerified=true → background-image set', () => {
        const { container } = render(<NewsCard item={baseItem} isVerified onClick={() => {}} />);
        const img = container.querySelector('.bg-cover');
        expect(img).toBeTruthy();
        expect(img.style.backgroundImage).toContain('y.jpg');
    });

    it('onClick → çağrılır', () => {
        const onClick = vi.fn();
        render(<NewsCard item={baseItem} isVerified onClick={onClick} />);
        fireEvent.click(screen.getByText('Başlık').closest('div.cursor-pointer'));
        expect(onClick).toHaveBeenCalled();
    });

    it('formatDateTime ile pubDate gösterilir', () => {
        render(<NewsCard item={baseItem} isVerified onClick={() => {}} />);
        expect(screen.getByText('DT:2026-06-01')).toBeInTheDocument();
    });

    it('NewsAssetChip aldığı item prop\'unu görüntüler', () => {
        render(<NewsCard item={baseItem} isVerified onClick={() => {}} />);
        expect(screen.getByTestId('chip').textContent).toBe('THYAO');
    });
});
