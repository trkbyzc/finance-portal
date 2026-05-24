import React from 'react';
import { Link } from 'react-router-dom';
import NavLogo from './components/NavLogo';
import NavDropdown from './components/NavDropdown';
import NavActions from './components/NavActions';
import { useAuth } from '../../../context/AuthContext'; // 🚀 YENİ EKLEME

export default function Navbar() {
    const { isAuthenticated, user, login, logout, isAdmin } = useAuth(); // isAdmin hook'tan içeri alındı

    // 🚀 TÜM NAVİGASYON BURADA TANIMLI - Değiştirmek çok kolay!
    const navConfig = [
        { title: 'Borsa', items: [
                { label: 'Türk Hisse Senetleri', to: '/markets/tr-stocks' },
                { label: 'ABD Hisse Senetleri', to: '/markets/us-stocks' },
                { type: 'divider' },
                { label: 'Vadeli İşlemler (VİOP)', to: '/markets/viop' }
            ]},
        { title: 'Döviz', items: [
                { label: 'TCMB Kurları', to: '/markets/currencies', desc: 'Resmi Gösterge Kuru' },
                { type: 'divider' },
                { label: 'Banka Kurları', to: '/markets/bank-currencies', desc: 'Alış / Satış & Makas', color: 'text-[#089981] group-hover/item:text-[#00c853]' }
            ]},
        // 🚀 KRİPTO GERİ GELDİ!
        { title: 'Kripto', items: [
                { label: 'Kripto Piyasası', to: '/markets/crypto', desc: 'Canlı Kripto Para Verileri', color: 'text-[#f7931a] group-hover/item:text-[#ffb74d]' }
            ]},
        { title: 'Emtialar', items: [
                { label: 'Türkiye Altın Piyasası', to: '/markets/turkish-gold', desc: 'Gram, Çeyrek, Has Altın', color: 'text-[#ffb74d] group-hover/item:text-[#ff9800]' },
                { type: 'divider' },
                { label: 'Kıymetli Madenler', to: '/markets/commodities', desc: 'Küresel ONS, Gümüş, Petrol' }
            ]},
        { title: 'Sabit Getiri', items: [
                { label: 'Mevduat Simülatörü', to: '/interest', color: 'text-[#089981] group-hover/item:text-[#00c853]' },
                { type: 'divider' },
                { label: 'Türkiye Tahvil & Bono', to: '/chart/TP.TRT070335K16?cat=TR_BOND', desc: 'EVDS / 10 Yıllık Gösterge' },
                { label: 'Küresel Tahviller', to: '/markets/bonds', desc: 'Yahoo Finance Verisi' },
                { label: 'Eurobond', to: '/markets/eurobonds', desc: 'TR Dış Borçlanma & FRED Getirisi', color: 'text-[#ff9800] group-hover/item:text-[#ffb74d]' }
            ]},
        { title: 'Yatırım Fonları', items: [
                { label: 'Türk Fonları', to: '/markets/tr-funds', desc: 'TEFAS Verisi' },
                { type: 'divider' },
                { label: 'Küresel Fonlar', to: '/markets/global-funds', desc: 'ETF Verisi' }
            ]}
    ];

    return (
        <nav className="h-16 border-b border-[#2a2e39] bg-[#050505]/95 backdrop-blur sticky top-0 z-50 flex items-center justify-between px-6">
            <div className="flex items-center gap-10">
                <NavLogo />

                <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#868993]">
                    <Link to="/" className="hover:text-white transition py-2 font-bold">PİYASA ÖZETİ</Link>

                    {navConfig.map((nav, idx) => (
                        <NavDropdown key={idx} title={nav.title} items={nav.items} />
                    ))}

                    <Link to="/news" className="hover:text-white transition py-2 font-bold uppercase">Haberler</Link>

                    {/* 🚀 YENİ: Kayıtlı kullanıcıya özel menü */}
                    {isAuthenticated && (
                        <Link to="/portfolio" className="hover:text-white transition py-2 font-bold uppercase text-[#089981]">
                            Portföyüm
                        </Link>
                    )}
                </div>
            </div>

            {/* 🚀 YENİ: Sadece Admin'lere özel menü */}
            {isAdmin && (
                <Link to="/admin" className="hover:text-white transition py-2 font-bold uppercase text-red-500">
                    Yönetim Paneli
                </Link>
            )}

            {/* 🚀 YENİ: Sağ tarafta auth butonları */}
            <div className="flex items-center gap-4">
                <NavActions />

                {isAuthenticated ? (
                    <div className="flex items-center gap-3">
                        <Link
                            to="/profile"
                            className="text-[#d1d4dc] hover:text-[#2962ff] transition text-sm font-semibold"
                        >
                            👤 {user?.preferred_username || 'Profil'}
                        </Link>
                        <button
                            onClick={logout}
                            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded text-white text-sm font-semibold transition"
                        >
                            Çıkış
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                window.location.href = 'http://localhost:8080/realms/finance-realm/protocol/openid-connect/registrations?' +
                                    'client_id=finance-client&' +
                                    'redirect_uri=http://localhost:5173/auth/callback&' +
                                    'response_type=code&' +
                                    'scope=openid';
                            }}
                            className="px-4 py-1.5 bg-[#089981] hover:bg-[#00c853] rounded text-white text-sm font-semibold transition"
                        >
                            Kayıt Ol
                        </button>

                        <button
                            onClick={() => {
                                window.location.href = 'http://localhost:8080/realms/finance-realm/protocol/openid-connect/auth?' +
                                    'client_id=finance-client&' +
                                    'redirect_uri=http://localhost:5173/auth/callback&' +
                                    'response_type=code&' +
                                    'scope=openid';
                            }}
                            className="px-4 py-1.5 bg-[#2962ff] hover:bg-[#1e4db7] rounded text-white text-sm font-semibold transition"
                        >
                            Giriş Yap
                        </button>

                    </div>
                )}
            </div>
        </nav>
    );
}
