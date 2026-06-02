import { useState, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { bondFundApi, historicalApi } from '../../../../services/api';
import EurobondList from './components/EurobondList';
import EurobondAreaChart from './components/EurobondAreaChart';

/**
 * Eurobond dashboard'u — master-detail.
 *
 * Solda seçili Türkiye Hazine eurobondunun area grafiği, sağda bono listesi
 * (kupon/vade/döviz/fiyat/getiri/değişim). Liste businessinsider'dan canlı çekilir;
 * grafik /market-data/historical?cat=EUROBOND üzerinden (EurobondChartStrategy).
 */
export default function EurobondDashboard() {
    const navigate = useNavigate();
    const { t } = useTranslation(['markets', 'asset', 'common']);
    const [selectedIsin, setSelectedIsin] = useState(null);
    const [range, setRange] = useState('1y');

    const { data: bonds = [], isLoading: listLoading } = useQuery({
        queryKey: ['eurobond-list'],
        queryFn: async () => (await bondFundApi.getEurobondList()) || []
    });

    // Seçili bono: kullanıcı seçimi varsa o, yoksa ilk bono (effect/setState yok — türetilmiş).
    const selected = useMemo(
        () => bonds.find(b => b.isin === selectedIsin) || bonds[0] || null,
        [bonds, selectedIsin]
    );

    const { data: history = [], isLoading: chartLoading } = useQuery({
        queryKey: ['eurobond-chart', selected?.isin, range],
        enabled: !!selected?.isin,
        queryFn: async () => {
            const res = await historicalApi.getData({ symbol: selected.isin, category: 'EUROBOND', range, interval: '1d' });
            const arr = Array.isArray(res) ? res : (res?.priceData || res || []);
            return arr
                .filter(p => p && (p.close != null || p.price != null))
                .map(p => ({
                    date: Array.isArray(p.date)
                        ? `${p.date[0]}-${String(p.date[1]).padStart(2, '0')}-${String(p.date[2]).padStart(2, '0')}`
                        : p.date,
                    close: Number(p.close ?? p.price)
                }))
                .filter(p => p.date && !Number.isNaN(p.close));
        }
    });

    return (
        <div className="min-h-screen bg-bg text-text">
          <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-text-muted hover:text-text mb-6 transition bg-surface-2 px-4 py-2 rounded-lg border border-border"
            >
                <ArrowLeft size={18} /> {t('asset:back')}
            </button>

            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-black uppercase text-text tracking-tight flex items-center gap-3">
                    <span className="w-2 h-8 bg-warning rounded-full"></span>
                    {t('markets:eurobonds.headerTitle')}
                </h1>
                <p className="text-text-muted text-sm mt-2 ml-5">{t('markets:eurobonds.headerSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 h-162.5">
                    <EurobondAreaChart
                        bond={selected}
                        history={history}
                        loading={chartLoading}
                        activeRange={range}
                        setActiveRange={setRange}
                    />
                </div>

                <div>
                    <EurobondList
                        bonds={bonds}
                        selected={selected}
                        onSelect={(b) => setSelectedIsin(b.isin)}
                        loading={listLoading}
                    />
                </div>
            </div>
          </div>
        </div>
    );
}
