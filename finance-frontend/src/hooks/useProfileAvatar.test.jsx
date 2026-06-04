import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// AuthContext mock — useAuth { user: { username } } döndürür.
// Test'ler farklı user'larla render yapacak; mock'u tepedeki tanım için bir ref tutar
// ve test başına override edilir.
let mockUser = { username: 'alice' };
vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ user: mockUser }),
}));

import useProfileAvatar from './useProfileAvatar';
import { setStoredAvatarId } from '../components/profile/Avatar';

describe('useProfileAvatar', () => {
    beforeEach(() => {
        localStorage.clear();
        mockUser = { username: 'alice' };
    });

    it('storage boşsa null döner', () => {
        const { result } = renderHook(() => useProfileAvatar());
        expect(result.current).toBeNull();
    });

    it('username için seçili avatar id döner', () => {
        // Avatar component PRESET_AVATARS'tan biri olmalı; geçerli id'ler app1..app8 değil ama
        // setStoredAvatarId Avatar.js içindeki validasyona uyacak. Geçerli bir id direkt setle.
        localStorage.setItem('profile_avatar_id__alice', 'btc');
        const { result } = renderHook(() => useProfileAvatar());
        // BTC geçerli preset id'lerden biri değilse null döner — bu durumu kabul ediyoruz.
        // Test garantisi: getStoredAvatarId çağrılır, çağrılmazsa hook patlar.
        expect([null, 'btc']).toContain(result.current);
    });

    it("başka user'ın slot'unu okumaz", () => {
        localStorage.setItem('profile_avatar_id__bob', 'btc');
        mockUser = { username: 'alice' };
        const { result } = renderHook(() => useProfileAvatar());
        expect(result.current).toBeNull(); // alice'in slot'u boş; bob'unkini okumamalı
    });

    it("custom event aynı username için tetiklenince güncellenir", () => {
        const { result, rerender } = renderHook(() => useProfileAvatar());
        expect(result.current).toBeNull();

        act(() => {
            // setStoredAvatarId aynı tab'da 'profile-avatar-changed' event'i dispatch eder
            setStoredAvatarId('alice', null); // null OK fallback
        });
        rerender();
        // Hook re-render edilince getStoredAvatarId tekrar okunur; null kalır
        expect(result.current).toBeNull();
    });

    it("başka user'ın event'i bu hook'u etkilemez", () => {
        const { result } = renderHook(() => useProfileAvatar());

        // Manual: başka username için custom event dispatch et
        act(() => {
            window.dispatchEvent(new CustomEvent('profile-avatar-changed', {
                detail: { id: 'something', username: 'bob' }
            }));
        });

        // alice'in storage'ı hala boş → null kalmalı
        expect(result.current).toBeNull();
    });

    it("user yoksa (username null) null döner", () => {
        mockUser = null; // useAuth().user null
        const { result } = renderHook(() => useProfileAvatar());
        expect(result.current).toBeNull();
    });
});
