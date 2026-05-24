import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Landmark, Ship, Coins, UserPlus, Star, Bell } from 'lucide-react';

import MarketTicker from '../../components/layout/MarketTicker/MarketTicker.jsx';
import { useDashboardData } from '../../hooks/useDashboardData.js';
import Modal from '../../components/layout/Modal.jsx'; // 🚀 MODAL EKLENDİ

import DashboardHero from './components/DashboardHero';
import DashboardTabPanel from './components/DashboardTabPanel';
import DashboardCalculator from './components/DashboardCalculator';
import DashboardFeatures from './components/DashboardFeatures';

const tabs = [
    { id: 'stocks', title: 'Hisseler', icon: <Globe size={16}/> },
    { id: 'currencies', title: 'Dövizler', icon: <Landmark size={16}/> },
    { id: 'commodities', title: 'Emtia', icon: <Ship size={16}/> },
    { id: 'crypto', title: 'Kripto', icon: <Coins size={16}/> }
];

export default function Dashboard() {
    const navigate = useNavigate();
    const {
        activeTab, setActiveTab, tabData, tabLoading,
        calcAmount, setCalcAmount, calcCurrency, setCalcCurrency,
        calculatedResult, usdRate
    } = useDashboardData();

    // 🚀 BAN MODAL STATE'İ
    const [banModal, setBanModal] = useState({ isOpen: false, msg: '' });

    // 🚀 URL PARAMETRELERİNİ YAKALAMA
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('banned') === 'true') {
            const message = urlParams.get('msg') || "Hesabınıza erişim kısıtlanmıştır.";
            setBanModal({ isOpen: true, msg: message });

            // Parametreleri temizle (tekrar gösterilmemesi için)
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-[#0b0e14] text-white font-sans overflow-x-hidden">

            {/* 🚀 MODAL BİLEŞENİ */}
            <Modal
                isOpen={banModal.isOpen}
                title="Erişim Engellendi"
                message={banModal.msg + "\n\nDetaylı bilgi için yönetim ile iletişime geçiniz."}
                type="error"
                onClose={() => setBanModal({ isOpen: false, msg: '' })}
            />

            <MarketTicker />

            {/* HERO SECTION */}
            <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center w-full">
                <DashboardHero navigate={navigate} />
                <DashboardTabPanel
                    tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}
                    tabData={tabData} tabLoading={tabLoading} navigate={navigate}
                />
            </div>

            {/* FEATURES SECTION */}
            <DashboardFeatures />

            {/* CALL TO ACTION & CALCULATOR SECTION */}
            <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center w-full">
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold">Ücretsiz Kayıt Ol, <br/><span className="text-[#2962ff]">Piyasayı Sen Yönet</span></h2>
                    <p className="text-[#787b86]">Misafir olarak verileri izlemek güzel, ancak kendi finansal üssünü kurmak çok daha iyi. Hemen kayıt ol ve ayrıcalıkları keşfet.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        <div className="p-4 bg-[#131722] border border-[#2a2e39] rounded-xl flex items-center gap-3 group hover:border-[#2962ff]/50 transition">
                            <div className="p-2 bg-[#2962ff]/10 rounded-lg text-[#2962ff]"><Star size={20}/></div>
                            <span className="text-sm font-semibold group-hover:text-white text-[#d1d4dc]">Favori Listesi Oluştur</span>
                        </div>
                        <div className="p-4 bg-[#131722] border border-[#2a2e39] rounded-xl flex items-center gap-3 group hover:border-[#00c853]/50 transition">
                            <div className="p-2 bg-[#00c853]/10 rounded-lg text-[#00c853]"><Bell size={20}/></div>
                            <span className="text-sm font-semibold group-hover:text-white text-[#d1d4dc]">Fiyat Alarmları Kur</span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/register')}
                        className="mt-6 px-8 py-3 bg-white text-black hover:bg-[#d1d4dc] transition-colors rounded-lg font-bold flex items-center gap-2"
                    >
                        <UserPlus size={18} /> Hesap Oluştur
                    </button>
                </div>

                <DashboardCalculator
                    calcAmount={calcAmount} setCalcAmount={setCalcAmount}
                    calcCurrency={calcCurrency} setCalcCurrency={setCalcCurrency}
                    calculatedResult={calculatedResult} usdRate={usdRate}
                />
            </div>
        </div>
    );
}