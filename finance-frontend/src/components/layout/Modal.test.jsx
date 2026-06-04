import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k }),
}));

import Modal from './Modal';

describe('Modal', () => {
    it('isOpen=false → null', () => {
        const { container } = render(<Modal isOpen={false} title="X" message="Y" />);
        expect(container.firstChild).toBeNull();
    });

    it('open → title + message render', () => {
        render(<Modal isOpen title="Hata" message="Yanlış işlem" onClose={() => {}} />);
        expect(screen.getByText('Hata')).toBeInTheDocument();
        expect(screen.getByText('Yanlış işlem')).toBeInTheDocument();
    });

    it('default confirmText → actions.confirm', () => {
        render(<Modal isOpen title="t" message="m" onClose={() => {}} />);
        expect(screen.getByText('actions.confirm')).toBeInTheDocument();
    });

    it('custom confirmText', () => {
        render(<Modal isOpen title="t" message="m" confirmText="Tamam" onClose={() => {}} />);
        expect(screen.getByText('Tamam')).toBeInTheDocument();
    });

    it('Confirm click → onClose', () => {
        const onClose = vi.fn();
        render(<Modal isOpen title="t" message="m" onClose={onClose} />);
        fireEvent.click(screen.getByText('actions.confirm'));
        expect(onClose).toHaveBeenCalled();
    });

    it('showCancel=true → iki buton, cancel click', () => {
        const onCancel = vi.fn();
        render(<Modal isOpen title="t" message="m" showCancel onCancel={onCancel} onClose={() => {}} />);
        fireEvent.click(screen.getByText('actions.cancel'));
        expect(onCancel).toHaveBeenCalled();
    });

    it.each([['error', '⚠️'], ['warning', '🛡️'], ['success', '✅'], ['info', 'ℹ️']])(
        'type=%s → emoji=%s',
        (type, emoji) => {
            render(<Modal isOpen type={type} title="t" message="m" onClose={() => {}} />);
            expect(screen.getByText(emoji)).toBeInTheDocument();
        }
    );

    it('bilinmeyen type → info fallback', () => {
        render(<Modal isOpen type="xxx" title="t" message="m" onClose={() => {}} />);
        expect(screen.getByText('ℹ️')).toBeInTheDocument();
    });
});
