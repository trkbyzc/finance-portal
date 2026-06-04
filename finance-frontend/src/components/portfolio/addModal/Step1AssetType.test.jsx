import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k, def) => def || k })
}));

import Step1AssetType from './Step1AssetType';

describe('Step1AssetType', () => {
    it('9 portfolio tipi için buton render', () => {
        const { container } = render(<Step1AssetType onSelect={() => {}} />);
        expect(container.querySelectorAll('button')).toHaveLength(9);
    });

    it('butona tık → onSelect(uiKey)', () => {
        const onSelect = vi.fn();
        const { container } = render(<Step1AssetType onSelect={onSelect} />);
        const firstBtn = container.querySelectorAll('button')[0];
        fireEvent.click(firstBtn);
        expect(onSelect).toHaveBeenCalledWith('STOCK');
    });
});
