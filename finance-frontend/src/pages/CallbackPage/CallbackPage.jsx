import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';

const CallbackPage = () => {
    const { handleCallback } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const hasRun = useRef(false); // 🚀 Sadece bir kez çalışsın

    useEffect(() => {
        // Zaten çalıştıysa tekrar çalıştırma
        if (hasRun.current) {
            console.log('⚠️ handleCallback zaten çalıştı, tekrar çalıştırılmıyor');
            return;
        }

        hasRun.current = true;

        const code = searchParams.get('code');
        const error = searchParams.get('error');

        console.log('📍 Callback sayfası - Code:', code?.substring(0, 20) + '...', 'Error:', error);

        if (error) {
            console.error('❌ Keycloak hatası:', error);
            alert('Giriş iptal edildi: ' + error);
            navigate('/');
            return;
        }

        if (code) {
            handleCallback(code);
        } else {
            console.error('❌ Code parametresi bulunamadı');
            navigate('/');
        }
    }, []); // 🚀 Dependency array boş - sadece mount'ta çalışır

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#050505]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2962ff] mx-auto mb-4"></div>
                <p className="text-[#d1d4dc] text-lg font-semibold">Giriş yapılıyor...</p>
                <p className="text-[#868993] text-sm mt-2">Lütfen bekleyin, yönlendiriliyorsunuz</p>
            </div>
        </div>
    );
};

export default CallbackPage;
