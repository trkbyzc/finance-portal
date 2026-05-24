import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CallbackPage = () => {
    const { handleCallback } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { t } = useTranslation('auth');
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            console.error('Keycloak error:', error);
            navigate('/');
            return;
        }

        if (code) {
            handleCallback(code);
        } else {
            navigate('/');
        }
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-bg">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-text text-lg font-semibold">{t('callback.processing')}</p>
                <p className="text-text-muted text-sm mt-2">{t('callback.redirecting')}</p>
            </div>
        </div>
    );
};

export default CallbackPage;
