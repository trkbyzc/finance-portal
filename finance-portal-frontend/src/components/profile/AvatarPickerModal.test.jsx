import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k, fb) => fb ?? k }),
}));

const { setStored, presetAvatars, authRef } = vi.hoisted(() => ({
    setStored: vi.fn(),
    presetAvatars: [
        { id: 'a1', label: 'A1' },
        { id: 'a2', label: 'A2' },
        { id: 'a3', label: 'A3' },
    ],
    authRef: { current: { user: { username: 'kurt' } } },
}));
vi.mock('./Avatar', () => ({
    default: ({ id, size }) => <div data-testid={`av-${id}`} data-size={size} />,
    PRESET_AVATARS: presetAvatars,
    setStoredAvatarId: setStored,
}));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => authRef.current }));

import AvatarPickerModal from './AvatarPickerModal';

beforeEach(() => setStored.mockReset());

describe('AvatarPickerModal', () => {
    it('open=false → null', () => {
        const { container } = render(<AvatarPickerModal open={false} currentId="a1" onClose={() => {}} />);
        expect(container.firstChild).toBeNull();
    });

    it('open=true → 3 preset render', () => {
        render(<AvatarPickerModal open currentId="a1" onClose={() => {}} />);
        expect(screen.getByTestId('av-a1')).toBeInTheDocument();
        expect(screen.getByTestId('av-a2')).toBeInTheDocument();
        expect(screen.getByTestId('av-a3')).toBeInTheDocument();
    });

    it('avatar tıklayınca seçim değişir + active border', () => {
        const { container } = render(<AvatarPickerModal open currentId="a1" onClose={() => {}} />);
        const btn = container.querySelector('[aria-label="select-avatar-a2"]');
        fireEvent.click(btn);
        expect(btn.className).toContain('border-primary');
    });

    it('Kaydet → setStoredAvatarId(username, id) + onClose', () => {
        const onClose = vi.fn();
        render(<AvatarPickerModal open currentId="a1" onClose={onClose} />);
        fireEvent.click(screen.getByText('Kaydet'));
        expect(setStored).toHaveBeenCalledWith('kurt', 'a1');
        expect(onClose).toHaveBeenCalled();
    });

    it('İlk harf kullan → setStoredAvatarId(username, null) + onClose', () => {
        const onClose = vi.fn();
        render(<AvatarPickerModal open currentId="a1" onClose={onClose} />);
        fireEvent.click(screen.getByText('İlk harf kullan'));
        expect(setStored).toHaveBeenCalledWith('kurt', null);
        expect(onClose).toHaveBeenCalled();
    });

    it('Backdrop → onClose; modal içine tık → stopPropagation', () => {
        const onClose = vi.fn();
        const { container } = render(<AvatarPickerModal open currentId="a1" onClose={onClose} />);
        const backdrop = container.firstChild;
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);

        fireEvent.click(container.querySelector('.bg-surface'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('X butonu → onClose', () => {
        const onClose = vi.fn();
        const { container } = render(<AvatarPickerModal open currentId="a1" onClose={onClose} />);
        const xBtn = container.querySelectorAll('button')[0];
        fireEvent.click(xBtn);
        expect(onClose).toHaveBeenCalled();
    });

    it('currentId null → Kaydet butonu disabled', () => {
        render(<AvatarPickerModal open currentId={null} onClose={() => {}} />);
        expect(screen.getByText('Kaydet')).toBeDisabled();
    });
});
