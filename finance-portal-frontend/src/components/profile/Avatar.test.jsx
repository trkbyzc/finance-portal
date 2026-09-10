import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import Avatar, { PRESET_AVATARS, storageKeyFor, getStoredAvatarId, setStoredAvatarId } from './Avatar';

beforeEach(() => {
    localStorage.clear();
});

describe('Avatar', () => {
    it('id verilirse preset gradient + emoji render', () => {
        const { container } = render(<Avatar id="fox" size={40} />);
        const div = container.firstChild;
        expect(div.getAttribute('aria-label')).toBe('avatar-fox');
        expect(div.textContent).toBe('🦊');
        expect(div.style.width).toBe('40px');
    });

    it('id yok → initials fallback', () => {
        const { container } = render(<Avatar fallbackInitials="kurt" size={32} />);
        expect(container.textContent).toBe('K');
        expect(container.firstChild.style.width).toBe('32px');
    });

    it('fallbackInitials boş → "?"', () => {
        const { container } = render(<Avatar />);
        expect(container.textContent).toBe('?');
    });

    it('bilinmeyen id → initials fallback', () => {
        const { container } = render(<Avatar id="xxx" fallbackInitials="abc" />);
        expect(container.textContent).toBe('A');
    });

    it('className prop merge', () => {
        const { container } = render(<Avatar id="fox" className="my-cls" />);
        expect(container.firstChild.className).toContain('my-cls');
    });
});

describe('storageKeyFor', () => {
    it('username yok → null', () => {
        expect(storageKeyFor(null)).toBeNull();
        expect(storageKeyFor(undefined)).toBeNull();
        expect(storageKeyFor('')).toBeNull();
    });

    it('username → prefixed key', () => {
        expect(storageKeyFor('kurt')).toBe('profile_avatar_id__kurt');
    });
});

describe('getStoredAvatarId / setStoredAvatarId', () => {
    it('username yok → null', () => {
        expect(getStoredAvatarId(null)).toBeNull();
    });

    it('localStorage boş → null', () => {
        expect(getStoredAvatarId('kurt')).toBeNull();
    });

    it('geçersiz id storage\'tan → null', () => {
        localStorage.setItem('profile_avatar_id__kurt', 'unknown_x');
        expect(getStoredAvatarId('kurt')).toBeNull();
    });

    it('geçerli id → o id döner', () => {
        localStorage.setItem('profile_avatar_id__kurt', 'fox');
        expect(getStoredAvatarId('kurt')).toBe('fox');
    });

    it('set + get round-trip', () => {
        setStoredAvatarId('kurt', 'panda');
        expect(localStorage.getItem('profile_avatar_id__kurt')).toBe('panda');
        expect(getStoredAvatarId('kurt')).toBe('panda');
    });

    it('set null → removeItem', () => {
        localStorage.setItem('profile_avatar_id__kurt', 'fox');
        setStoredAvatarId('kurt', null);
        expect(localStorage.getItem('profile_avatar_id__kurt')).toBeNull();
    });

    it('set username yok → noop', () => {
        setStoredAvatarId(null, 'fox');
        expect(localStorage.length).toBe(0);
    });

    it('set → CustomEvent dispatch (profile-avatar-changed)', () => {
        const listener = (e) => { listener.detail = e.detail; };
        window.addEventListener('profile-avatar-changed', listener);
        setStoredAvatarId('kurt', 'fox');
        expect(listener.detail).toEqual({ id: 'fox', username: 'kurt' });
        window.removeEventListener('profile-avatar-changed', listener);
    });
});

describe('PRESET_AVATARS', () => {
    it('en az 8 preset + her birinde id/emoji/gradient', () => {
        expect(PRESET_AVATARS.length).toBeGreaterThanOrEqual(8);
        PRESET_AVATARS.forEach(a => {
            expect(a.id).toBeTruthy();
            expect(a.emoji).toBeTruthy();
            expect(a.gradient).toMatch(/linear-gradient/);
        });
    });
});
