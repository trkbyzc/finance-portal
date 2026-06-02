import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/layout/Modal.jsx';

import GuestDashboard from './GuestDashboard';
import AuthenticatedDashboard from './AuthenticatedDashboard';

/**
 * Dashboard yönlendirici:
 *   - Giriş yapmamış  → GuestDashboard (sistemi tanıtan landing)
 *   - Giriş yapmış    → AuthenticatedDashboard (kişiye özel: portföy, izleme, haberler...)
 *
 * Ban modal'ı (Keycloak login reddi sonrası ?banned=true ile dönüş) her iki durumda da
 * gösterilebildiği için burada, yönlendirmenin üstünde tutulur.
 */
export default function Dashboard() {
    const { t } = useTranslation('dashboard');
    const { isAuthenticated } = useAuth();

    // ?banned=true ile dönüşte ban modal'ı — URL'i mount anında state başlatıcıda oku
    // (effect içinde setState ile cascading render'a girmemek için).
    const [banModal, setBanModal] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('banned') === 'true') {
            return { isOpen: true, msg: urlParams.get('msg') || t('errors.accessDeniedMessage') };
        }
        return { isOpen: false, msg: '' };
    });

    // URL'i temizle (setState yok → effect güvenli)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('banned') === 'true') {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    return (
        <div className="min-h-screen bg-bg text-text font-sans overflow-x-hidden">
            <Modal
                isOpen={banModal.isOpen}
                title={t('errors.accessDenied')}
                message={banModal.msg + "\n\n" + t('errors.accessDeniedDetail')}
                type="error"
                onClose={() => setBanModal({ isOpen: false, msg: '' })}
            />

            {isAuthenticated ? <AuthenticatedDashboard /> : <GuestDashboard />}
        </div>
    );
}
