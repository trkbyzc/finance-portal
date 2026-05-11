import React from 'react';
import TopMoversSidebar from './components/TopMoversSidebar.jsx';
import StockListTable from './components/StockListTable.jsx';
import BistInfoCards from './components/BistInfoCards.jsx';

export default function TurkishStocksDashboard({ category }) {
    return (
        <div className="min-h-screen bg-[#0b0e14] text-white p-6 lg:p-10">

            {/* ÜST BAŞLIK */}
            <div className="mb-8">
                <h1 className="text-3xl font-black uppercase text-white tracking-tight flex items-center gap-3">
                    <span className="w-2 h-8 bg-[#2962ff] rounded-full"></span>
                    Borsa İstanbul (BIST)
                </h1>
                <p className="text-[#868993] text-sm mt-2 ml-5">
                    Türk Hisse Senetleri piyasasının en hareketli varlıkları ve detaylı listesi.
                </p>
            </div>

            {/* BIST ÖZEL BİLGİ KARTLARI (Örn: Toplam Hacim, Yabancı Oranı vs) */}
            <BistInfoCards />

            {/* ANA İSKELET: SOLDA SİDEBAR, SAĞDA DEV TABLO */}
            <div className="flex flex-col lg:flex-row gap-6">

                {/* SOL SÜTUN: En Çok Artanlar / Azalanlar (Genişliği sabit, mobilde üste geçer) */}
                <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col gap-6">
                    <TopMoversSidebar type="gainers" />
                    <TopMoversSidebar type="losers" />
                </div>

                {/* SAĞ SÜTUN: Tüm Hisseler (Arama Çubuklu Dinamik Liste) */}
                <div className="w-full lg:w-2/3 xl:w-3/4 bg-[#131722] border border-[#2a2e39] rounded-xl shadow-2xl p-6">
                    <StockListTable />
                </div>

            </div>
        </div>
    );
}