import { useEffect, useState } from 'react';

import { useAuth } from '../../context/AuthContext';
import BanNoticeModal from '../../components/layout/BanNoticeModal.jsx';

import GuestDashboard from './GuestDashboard';
import AuthenticatedDashboard from './AuthenticatedDashboard';

/**
 * Dashboard yönlendirici:
 *   - Giriş yapmamış  → GuestDashboard (sistemi tanıtan landing)
 *   - Giriş yapmış    → AuthenticatedDashboard (kişiye özel: portföy, izleme, haberler...)
 *
 * Ban bildirimi: banlı kullanıcı giriş yapınca apiClient 403 yakalar, ban detayını
 * sessionStorage'a yazıp /?banned=true ile buraya döner; burada gün/bitiş tarihli pop-up gösterilir.
 */
export default function Dashboard() {
    const { isAuthenticated } = useAuth();

    // ?banned=true ile dönüşte ban detayını sessionStorage'dan oku (mount anında, tek sefer)
    const [banInfo, setBanInfo] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('banned') !== 'true') return null;
        try {
            const raw = sessionStorage.getItem('ban_info');
            return raw ? JSON.parse(raw) : { message: '', banType: null, until: null };
        } catch {
            return { message: '', banType: null, until: null };
        }
    });

    // URL'i ve sessionStorage'ı temizle (setState yok → effect güvenli)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('banned') === 'true') {
            window.history.replaceState({}, document.title, window.location.pathname);
            try { sessionStorage.removeItem('ban_info'); } catch { /* yoksay */ }
        }
    }, []);

    return (
        <div className="min-h-screen bg-bg text-text font-sans overflow-x-hidden">
            {banInfo && <BanNoticeModal info={banInfo} onClose={() => setBanInfo(null)} />}

            {isAuthenticated ? <AuthenticatedDashboard /> : <GuestDashboard />}
        </div>
    );
}
