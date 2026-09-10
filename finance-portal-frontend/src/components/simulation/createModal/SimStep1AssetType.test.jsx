import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k })
}));

import SimStep1AssetType from './SimStep1AssetType';

describe('SimStep1AssetType', () => {
    it('8 simulation asset tipi için buton render', () => {
        const { container } = render(<SimStep1AssetType onSelect={() => {}} />);
        expect(container.querySelectorAll('button')).toHaveLength(8);
    });

    it('butona tık → onSelect(uiKey) callback', () => {
        const onSelect = vi.fn();
        const { container } = render(<SimStep1AssetType onSelect={onSelect} />);
        const firstBtn = container.querySelectorAll('button')[0];
        fireEvent.click(firstBtn);
        expect(onSelect).toHaveBeenCalledWith('STOCK');
    });

    it('her butonda title + sub açıklama', () => {
        const { container } = render(<SimStep1AssetType onSelect={() => {}} />);
        const buttons = container.querySelectorAll('button');
        buttons.forEach(b => {
            expect(b.querySelectorAll('div').length).toBeGreaterThanOrEqual(2);
        });
    });
});
