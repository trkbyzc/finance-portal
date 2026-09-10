import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k })
}));

import LogoutConfirmModal from './LogoutConfirmModal';

describe('LogoutConfirmModal', () => {
    it('open=false → null render', () => {
        const { container } = render(<LogoutConfirmModal open={false} onConfirm={() => {}} onCancel={() => {}} />);
        expect(container.firstChild).toBeNull();
    });

    it('open=true → title + body + iki buton render', () => {
        render(<LogoutConfirmModal open={true} onConfirm={() => {}} onCancel={() => {}} />);
        expect(screen.getByText('logoutConfirm.title')).toBeInTheDocument();
        expect(screen.getByText('logoutConfirm.body')).toBeInTheDocument();
        expect(screen.getByText('logoutConfirm.confirm')).toBeInTheDocument();
    });

    it('Confirm butonuna tık → onConfirm', () => {
        const onConfirm = vi.fn();
        render(<LogoutConfirmModal open={true} onConfirm={onConfirm} onCancel={() => {}} />);
        fireEvent.click(screen.getByText('logoutConfirm.confirm'));
        expect(onConfirm).toHaveBeenCalled();
    });

    it('Cancel butonu → onCancel', () => {
        const onCancel = vi.fn();
        render(<LogoutConfirmModal open={true} onConfirm={() => {}} onCancel={onCancel} />);
        const cancelBtn = screen.getByText(/logoutConfirm.cancel/);
        fireEvent.click(cancelBtn);
        expect(onCancel).toHaveBeenCalled();
    });

    it('backdrop tıklayınca onCancel (outside click)', () => {
        const onCancel = vi.fn();
        const { container } = render(<LogoutConfirmModal open={true} onConfirm={() => {}} onCancel={onCancel} />);
        const backdrop = container.firstChild;
        fireEvent.click(backdrop);
        expect(onCancel).toHaveBeenCalled();
    });

    it('modal içine tık → onCancel TETİKLENMEZ (stopPropagation)', () => {
        const onCancel = vi.fn();
        render(<LogoutConfirmModal open={true} onConfirm={() => {}} onCancel={onCancel} />);
        const dialog = screen.getByRole('dialog');
        fireEvent.click(dialog);
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('Escape tuşu → onCancel', () => {
        const onCancel = vi.fn();
        render(<LogoutConfirmModal open={true} onConfirm={() => {}} onCancel={onCancel} />);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalled();
    });
});
