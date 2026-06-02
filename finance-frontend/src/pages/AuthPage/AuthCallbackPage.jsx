import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import authApi from '../../services/api/authApi';
import tokenManager from '../../utils/tokenManager';

const AuthCallbackPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t } = useTranslation('auth');
    const [message, setMessage] = useState(t('callback.processing'));

    useEffect(() => {
        const processCallback = async () => {
            const code = searchParams.get('code');
            const error = searchParams.get('error');

            if (error) {
                console.error('Keycloak error:', error);
                setMessage(t('callback.error'));
                setTimeout(() => navigate('/'), 3000);
                return;
            }

            if (!code) {
                console.error('No authorization code');
                setMessage(t('callback.error'));
                setTimeout(() => navigate('/'), 3000);
                return;
            }

            try {
                const tokenData = await authApi.exchangeCodeForToken(code);

                if (tokenData && tokenData.access_token) {
                    tokenManager.setTokens(tokenData.access_token, tokenData.refresh_token);
                    // id_token'ı sakla → çıkışta id_token_hint olarak kullanılır, böylece
                    // Keycloak kendi çıkış onay sayfasını ATLAR (uygulama içi pop-up yeterli).
                    if (tokenData.id_token) {
                        localStorage.setItem('id_token', tokenData.id_token);
                    }
                    setMessage(t('callback.success'));

                    setTimeout(() => {
                        window.location.href = '/';
                    }, 500);

                } else {
                    setMessage(t('callback.error'));
                    setTimeout(() => navigate('/'), 3000);
                }
            } catch (err) {
                console.error('Callback error:', err);
                setMessage(t('callback.error'));
                setTimeout(() => navigate('/'), 3000);
            }
        };

        processCallback();
    }, [searchParams, navigate, t]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-bg">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-text text-lg font-semibold">{message}</p>
            </div>
        </div>
    );
};

export default AuthCallbackPage;
