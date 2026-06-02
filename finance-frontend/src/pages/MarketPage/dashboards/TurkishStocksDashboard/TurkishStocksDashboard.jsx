import React from 'react';
import TopMoversSidebar from './components/TopMoversSidebar.jsx';
import HighestVolumeSidebar from './components/HighestVolumeSidebar.jsx';
import StockListTable from './components/StockListTable.jsx';
import BistInfoCards from './components/BistInfoCards.jsx';
import NewsSection from '../../../../components/news/NewsSection.jsx';

/**
 * Türk Hisse Senetleri sayfası — Stitch tasarımına göre düzenleme:
 *   - Üst: 3 KPI kart (BistInfoCards)
 *   - Sol kolon: Top Gainers / Top Losers / Highest Volume (3 sidebar üst üste)
 *   - Sağ kolon: Tüm Hisseler tablosu + altında haber grid (aynı sütun içinde)
 *
 * Sayfa header'ı kaldırıldı (tasarımda yok). News mt='' olarak override edilir
 * çünkü parent flex-col gap-6 kullanıyor.
 */
export default function TurkishStocksDashboard() {
    return (
        <div className="min-h-screen bg-bg text-text">
          <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
            <BistInfoCards />

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col gap-6">
                    <TopMoversSidebar type="gainers" />
                    <TopMoversSidebar type="losers" />
                    <HighestVolumeSidebar />
                </div>

                <div className="w-full lg:w-2/3 xl:w-3/4 flex flex-col gap-6">
                    <div className="bg-surface border border-border rounded-xl shadow-2xl p-6">
                        <StockListTable />
                    </div>
                    <NewsSection
                        category="Borsa"
                        titleKey="news:categories.stock"
                        accent="primary"
                        limit={4}
                        className=""
                        gridClassName="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
                    />
                </div>
            </div>
          </div>
        </div>
    );
}
