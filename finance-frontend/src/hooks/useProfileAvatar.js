import { useSyncExternalStore } from 'react';
import { getStoredAvatarId, storageKeyFor } from '../components/profile/Avatar';
import { useAuth } from '../context/AuthContext';

/**
 * Aktif kullanıcının avatar id'sini döner. Storage user-prefixed'tir
 * (`profile_avatar_id__<username>`); başka kullanıcılar birbirinin avatar'ını görmez.
 *
 * useSyncExternalStore + iki kanal:
 *  - aynı tab'da `profile-avatar-changed` custom event (Avatar.setStoredAvatarId tetikler)
 *  - başka tab'larda native `storage` event
 *
 * username değişince (login/logout) snapshot otomatik yeniden çekilir (storageKeyFor değişir).
 */
function subscribe(callback) {
    window.addEventListener('profile-avatar-changed', callback);
    window.addEventListener('storage', callback);
    return () => {
        window.removeEventListener('profile-avatar-changed', callback);
        window.removeEventListener('storage', callback);
    };
}

export default function useProfileAvatar() {
    const { user } = useAuth();
    const username = user?.username || null;
    return useSyncExternalStore(
        subscribe,
        () => getStoredAvatarId(username),
        () => null
    );
}

// storageKeyFor sadece dolaylı kullanılıyor — diğer dosyalar import edebilsin diye re-export
export { storageKeyFor };
