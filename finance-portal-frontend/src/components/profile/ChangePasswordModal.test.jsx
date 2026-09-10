import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// userApi.changePassword'ı mock'la
vi.mock('../../services/api/userApi', () => ({
    userApi: {
        changePassword: vi.fn(),
    },
}));

// useNotify — toast fonksiyonu
const notifyMock = vi.fn();
vi.mock('../../context/NotificationContext', () => ({
    useNotify: () => notifyMock,
}));

// react-i18next — t() çıktısı = key (test'ler etiketi key olarak görür)
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k }),
}));

import ChangePasswordModal from './ChangePasswordModal';
import { userApi } from '../../services/api/userApi';

describe('ChangePasswordModal', () => {
    const onClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('open=false render etmez', () => {
        const { container } = render(<ChangePasswordModal open={false} onClose={onClose} />);
        expect(container.firstChild).toBeNull();
    });

    it('open=true → 3 input + submit button render eder', () => {
        render(<ChangePasswordModal open={true} onClose={onClose} />);
        expect(screen.getByText('profile:passwordModal.oldPassword')).toBeInTheDocument();
        expect(screen.getByText('profile:passwordModal.newPassword')).toBeInTheDocument();
        expect(screen.getByText('profile:passwordModal.newPasswordConfirm')).toBeInTheDocument();
        expect(screen.getByText('profile:passwordModal.submit')).toBeInTheDocument();
    });

    it("boş input'larda submit butonu disabled", () => {
        render(<ChangePasswordModal open={true} onClose={onClose} />);
        const btn = screen.getByText('profile:passwordModal.submit').closest('button');
        expect(btn).toBeDisabled();
    });

    it('yeni şifre 8 karakterden kısa → inline error', async () => {
        const user = userEvent.setup();
        render(<ChangePasswordModal open={true} onClose={onClose} />);
        const [oldI, newI, confI] = Array.from(document.querySelectorAll('input[type="password"]'));

        await user.type(oldI, 'oldpass1');
        await user.type(newI, 'kisa');
        await user.type(confI, 'kisa');

        const btn = screen.getByText('profile:passwordModal.submit').closest('button');
        await user.click(btn);

        expect(screen.getByText('profile:passwordModal.tooShort')).toBeInTheDocument();
        expect(userApi.changePassword).not.toHaveBeenCalled();
    });

    it('yeni şifre 8+ ama eşleşmiyor → mismatch error', async () => {
        const user = userEvent.setup();
        render(<ChangePasswordModal open={true} onClose={onClose} />);
        const [oldI, newI, confI] = Array.from(document.querySelectorAll('input[type="password"]'));

        await user.type(oldI, 'oldpass1');
        await user.type(newI, 'newpass123');
        await user.type(confI, 'newpass999');
        await user.click(screen.getByText('profile:passwordModal.submit').closest('button'));

        expect(screen.getByText('profile:passwordModal.mismatch')).toBeInTheDocument();
        expect(userApi.changePassword).not.toHaveBeenCalled();
    });

    it('yeni şifre eski ile aynı → sameAsOld error', async () => {
        const user = userEvent.setup();
        render(<ChangePasswordModal open={true} onClose={onClose} />);
        const [oldI, newI, confI] = Array.from(document.querySelectorAll('input[type="password"]'));

        await user.type(oldI, 'samepass1');
        await user.type(newI, 'samepass1');
        await user.type(confI, 'samepass1');
        await user.click(screen.getByText('profile:passwordModal.submit').closest('button'));

        expect(screen.getByText('profile:passwordModal.sameAsOld')).toBeInTheDocument();
        expect(userApi.changePassword).not.toHaveBeenCalled();
    });

    it('geçerli form → userApi.changePassword çağrılır + success toast + onClose', async () => {
        userApi.changePassword.mockResolvedValue({});
        const user = userEvent.setup();
        render(<ChangePasswordModal open={true} onClose={onClose} />);
        const [oldI, newI, confI] = Array.from(document.querySelectorAll('input[type="password"]'));

        await user.type(oldI, 'oldpass1');
        await user.type(newI, 'newpass123');
        await user.type(confI, 'newpass123');
        await user.click(screen.getByText('profile:passwordModal.submit').closest('button'));

        await waitFor(() => {
            expect(userApi.changePassword).toHaveBeenCalledWith('oldpass1', 'newpass123');
        });
        await waitFor(() => {
            expect(notifyMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
        });
        await waitFor(() => {
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('backend hata → error toast + inline error', async () => {
        userApi.changePassword.mockRejectedValue({
            response: { data: { message: 'Mevcut şifre yanlış.' } }
        });
        const user = userEvent.setup();
        render(<ChangePasswordModal open={true} onClose={onClose} />);
        const [oldI, newI, confI] = Array.from(document.querySelectorAll('input[type="password"]'));

        await user.type(oldI, 'wrongold');
        await user.type(newI, 'newpass123');
        await user.type(confI, 'newpass123');
        await user.click(screen.getByText('profile:passwordModal.submit').closest('button'));

        await waitFor(() => {
            expect(notifyMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
        });
        expect(onClose).not.toHaveBeenCalled();
    });
});
