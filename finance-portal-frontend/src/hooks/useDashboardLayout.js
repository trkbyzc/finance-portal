import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY_PREFIX = 'dashboard:layout:v1';

/** Kullanıcıya bağlı storage anahtarı — aynı tarayıcıda farklı kullanıcılar kendi yerleşimini görsün. */
function storageKeyFor(username) {
    return username ? `${STORAGE_KEY_PREFIX}:${username}` : STORAGE_KEY_PREFIX;
}

/**
 * Dashboard widget yerleşimini yönetir (sıra + gizli set) ve localStorage'a kalıcılaştırır.
 * Kod tarafına yeni widget eklenirse otomatik olarak sona eklenir (eski kayıt bozulmaz).
 *
 * @param {string[]} allKeys registry'deki tüm widget anahtarları (varsayılan sıra)
 * @param {string} [username] giriş yapmış kullanıcı — yoksa anonim/legacy anahtar kullanılır
 */
export function useDashboardLayout(allKeys, username) {
    const storageKey = storageKeyFor(username);
    const [state, setState] = useState(() => load(allKeys, storageKey));

    // Kullanıcı değişince (logout/login farklı user) state'i yeniden yükle.
    // DİKKAT: allKeys'i deps'e koyma — caller (AuthenticatedDashboard) registry
    // her render'da yeni referans dönüyor olabilir, infinite loop'a sebep olur.
    // allKeys yalnız initial load için kullanılır; storageKey değişince re-load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setState(load(allKeys, storageKey));
    }, [storageKey]);

    useEffect(() => {
        try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* quota/private mode */ }
    }, [state, storageKey]);

    const disabled = useMemo(() => new Set(state.disabled), [state.disabled]);

    // Kod tarafında eklenen yeni anahtarları sıraya dahil et (görünür anahtarlar)
    const enabledKeys = useMemo(
        () => state.order.filter(k => allKeys.includes(k) && !disabled.has(k)),
        [state.order, allKeys, disabled]
    );

    const availableKeys = useMemo(
        () => allKeys.filter(k => !enabledKeys.includes(k)),
        [allKeys, enabledKeys]
    );

    // HTML5 drag-drop sırasında çağrılır; targetKey bulunamazsa sona ekler.
    const reorder = useCallback((dragKey, targetKey) => {
        if (dragKey === targetKey) return;
        setState(s => {
            const order = mergedOrder(s.order, allKeys);
            const from = order.indexOf(dragKey);
            if (from < 0) return s;
            order.splice(from, 1);
            let to = order.indexOf(targetKey);
            if (to < 0) to = order.length;
            order.splice(to, 0, dragKey);
            return { ...s, order };
        });
    }, [allKeys]);

    const remove = useCallback((key) => {
        setState(s => (s.disabled.includes(key) ? s : { ...s, disabled: [...s.disabled, key] }));
    }, []);

    const add = useCallback((key) => {
        setState(s => {
            const order = mergedOrder(s.order, allKeys);
            if (!order.includes(key)) order.push(key);
            return { order, disabled: s.disabled.filter(k => k !== key) };
        });
    }, [allKeys]);

    const reset = useCallback(() => setState({ order: [...allKeys], disabled: [] }), [allKeys]);

    return { enabledKeys, availableKeys, reorder, remove, add, reset };
}

function mergedOrder(order, allKeys) {
    const merged = order.filter(k => allKeys.includes(k));
    allKeys.forEach(k => { if (!merged.includes(k)) merged.push(k); });
    return merged;
}

function load(allKeys, storageKey) {
    try {
        const raw = JSON.parse(localStorage.getItem(storageKey));
        if (raw && Array.isArray(raw.order)) {
            return {
                order: mergedOrder(raw.order, allKeys),
                disabled: (Array.isArray(raw.disabled) ? raw.disabled : []).filter(k => allKeys.includes(k)),
            };
        }
    } catch { /* ignore corrupt */ }
    return { order: [...allKeys], disabled: [] };
}
