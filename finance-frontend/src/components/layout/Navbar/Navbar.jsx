import React from 'react';
import { Link } from 'react-router-dom';
import NavLogo from './components/NavLogo';
import NavDropdown from './components/NavDropdown';
import NavActions from './components/NavActions';

export default function Navbar() {
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
        { title: 'Faiz & Fonlar', items: [
                { label: 'Mevduat Simülatörü', to: '/interest', color: 'text-[#089981] group-hover/item:text-[#00c853]' },
                { type: 'divider' },
                { label: 'Türkiye Tahvil & Bono', to: '/chart/TP.TRT070335K16', desc: 'EVDS / 10 Yıllık Gösterge' },
                { label: 'Küresel Tahviller', to: '/markets/bonds', desc: 'Yahoo Finance Verisi' },
                { type: 'divider' },
                { label: 'Yatırım Fonları', submenu: [
                        { label: 'Türk Fonları', to: '/markets/tr-funds', desc: 'TEFAS Verisi' },
                        { label: 'Küresel Fonlar', to: '/markets/global-funds', desc: 'ETF Verisi' }
                    ]}
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
                </div>
            </div>

            <NavActions />
        </nav>
    );
}