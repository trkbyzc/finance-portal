import { useEffect, useState } from 'react';
import { getStoredAvatarId } from '../components/profile/Avatar';

/**
 * localStorage-backed avatar id hook.
 * - Aynı tab'da Avatar.setStoredAvatarId() çağrılırsa `profile-avatar-changed` event ile güncellenir.
 * - Diğer tab'larda native `storage` event ile sync.
 */
export default function useProfileAvatar() {
    const [avatarId, setAvatarId] = useState(() => getStoredAvatarId());

    useEffect(() => {
        const handleCustom = (e) => setAvatarId(e.detail?.id ?? null);
        const handleStorage = (e) => {
            if (e.key === 'profile_avatar_id') {
                setAvatarId(e.newValue || null);
            }
        };
        window.addEventListener('profile-avatar-changed', handleCustom);
        window.addEventListener('storage', handleStorage);
        return () => {
            window.removeEventListener('profile-avatar-changed', handleCustom);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    return avatarId;
}
