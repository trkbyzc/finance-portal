import React from 'react';

/**
 * 8 preset avatar — emoji + gradient. localStorage'da `profile_avatar_id` olarak id saklanır.
 * Yeni avatar eklerken sona ekle; mevcut id'lerin sırasını değiştirme (eski kullanıcılar bozulur).
 */
export const PRESET_AVATARS = [
    { id: 'fox',     emoji: '🦊', gradient: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)' },
    { id: 'cat',     emoji: '🐱', gradient: 'linear-gradient(135deg, #f59e0b 0%, #fde68a 100%)' },
    { id: 'dog',     emoji: '🐶', gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' },
    { id: 'panda',   emoji: '🐼', gradient: 'linear-gradient(135deg, #475569 0%, #94a3b8 100%)' },
    { id: 'tiger',   emoji: '🐯', gradient: 'linear-gradient(135deg, #ea580c 0%, #ef4444 100%)' },
    { id: 'lion',    emoji: '🦁', gradient: 'linear-gradient(135deg, #eab308 0%, #f97316 100%)' },
    { id: 'penguin', emoji: '🐧', gradient: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)' },
    { id: 'unicorn', emoji: '🦄', gradient: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)' },
    { id: 'robot',   emoji: '🤖', gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' },
    { id: 'alien',   emoji: '👽', gradient: 'linear-gradient(135deg, #10b981 0%, #84cc16 100%)' },
    { id: 'ghost',   emoji: '👻', gradient: 'linear-gradient(135deg, #6366f1 0%, #c084fc 100%)' },
    { id: 'crown',   emoji: '👑', gradient: 'linear-gradient(135deg, #ca8a04 0%, #fde047 100%)' }
];

const STORAGE_KEY_PREFIX = 'profile_avatar_id__';

/** localStorage anahtarı kullanıcıya bağlı — aksi halde superadmin'in avatar'ı her hesapta görünür. */
export function storageKeyFor(username) {
    return username ? `${STORAGE_KEY_PREFIX}${username}` : null;
}

/**
 * `null` → kullanıcının seçimi yok, çağıran kod initials fallback'ine düşmeli.
 * Cross-tab senkronu için `storage` event dispatch edilir (Navbar dinler).
 */
export function getStoredAvatarId(username) {
    const key = storageKeyFor(username);
    if (!key) return null;
    try {
        const v = localStorage.getItem(key);
        if (!v) return null;
        return PRESET_AVATARS.some(a => a.id === v) ? v : null;
    } catch {
        return null;
    }
}

export function setStoredAvatarId(username, id) {
    const key = storageKeyFor(username);
    if (!key) return;
    try {
        if (id == null) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, id);
        }
        // Aynı tab'da listener'ları tetikle — username de payload'a koy ki başka user'ın eventi yanlış güncelleme yapmasın
        window.dispatchEvent(new CustomEvent('profile-avatar-changed', { detail: { id, username } }));
    } catch {
        // localStorage erişilemiyorsa sessiz geç (incognito vb.)
    }
}

/**
 * Avatar component — `id` verilirse preset gradient + emoji, yoksa initials fallback.
 * `size` px cinsinden çapı belirler; font ve emoji bunu izler.
 */
export default function Avatar({ id, fallbackInitials, size = 40, className = '', style = {} }) {
    const preset = PRESET_AVATARS.find(a => a.id === id);
    const dim = `${size}px`;
    const fontSize = Math.round(size * 0.55);

    if (preset) {
        return (
            <div
                className={`rounded-full flex items-center justify-center shadow-sm ${className}`}
                style={{
                    width: dim,
                    height: dim,
                    background: preset.gradient,
                    fontSize: `${fontSize}px`,
                    lineHeight: 1,
                    ...style
                }}
                aria-label={`avatar-${preset.id}`}
            >
                <span style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}>
                    {preset.emoji}
                </span>
            </div>
        );
    }

    // Initials fallback — class-based renkler tema-aware
    return (
        <div
            className={`rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-black uppercase ${className}`}
            style={{
                width: dim,
                height: dim,
                fontSize: `${Math.round(size * 0.4)}px`,
                ...style
            }}
        >
            {(fallbackInitials || '?').toString().charAt(0).toUpperCase()}
        </div>
    );
}
