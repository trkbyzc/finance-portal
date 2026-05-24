import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authApi from '../../services/api/authApi';
import tokenManager from '../../utils/tokenManager';

const AuthCallbackPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState('Giriş yapılıyor...');

    useEffect(() => {
        const processCallback = async () => {
            const code = searchParams.get('code');
            const error = searchParams.get('error');

            if (error) {
                console.error('❌ Keycloak error:', error);
                setMessage('Giriş iptal edildi');
                setTimeout(() => navigate('/'), 3000);
                return;
            }

            if (!code) {
                console.error('❌ Authorization code bulunamadı');
                setMessage('Geçersiz yanıt');
                setTimeout(() => navigate('/'), 3000);
                return;
            }

            console.log('🔵 Authorization code alındı:', code.substring(0, 20) + '...');

            try {
                // Backend'e değil, direkt Keycloak'a code gönder, token al (Faz-2 güncel)
                const tokenData = await authApi.exchangeCodeForToken(code);
                console.log('🔵 Keycloak Token data:', tokenData);

                if (tokenData && tokenData.access_token) {
                    // Token'ları localStorage'a kaydet
                    tokenManager.setTokens(tokenData.access_token, tokenData.refresh_token);
                    console.log('✅ Token başarıyla alındı ve kaydedildi');

                    setMessage('✅ Giriş başarılı!');

                    // Sayfayı yenile (AuthContext token'ı okuyacak)
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 500);

                } else {
                    console.error('❌ Token alınamadı, response boş geldi');
                    setMessage('Token verisi hatalı');
                    setTimeout(() => navigate('/'), 3000);
                }
            } catch (err) {
                console.error('❌ Callback hatası:', err);
                setMessage('Dönüşümde hata oluştu: ' + (err.error_description || err.message || err));
                setTimeout(() => navigate('/'), 3000);
            }
        };

        processCallback();
    }, [searchParams, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#050505]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2962ff] mx-auto mb-4"></div>
                <p className="text-[#d1d4dc] text-lg font-semibold">{message}</p>
            </div>
        </div>
    );
};

export default AuthCallbackPage;
