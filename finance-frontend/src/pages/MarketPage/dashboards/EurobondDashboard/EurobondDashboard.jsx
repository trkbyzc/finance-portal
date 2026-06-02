import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { bondFundApi } from '../../../../services/api';
import EurobondList from './components/EurobondList';

/**
 * Eurobond dashboard'u — VİOP tarzı.
 *
 * Tam genişlik Türkiye Hazine eurobond listesi (businessinsider canlı); bir satıra
 * tıklayınca o bononun fiyat grafiği detay sayfasında açılır (/chart/:isin?cat=EUROBOND).
 */
export default function EurobondDashboard() {
    const navigate = useNavigate();
    const { t } = useTranslation(['markets', 'asset']);

    const { data: bonds = [], isLoading } = useQuery({
        queryKey: ['eurobond-list'],
        queryFn: async () => (await bondFundApi.getEurobondList()) || []
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
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-text tracking-tight flex items-center gap-3">
                    <span className="w-2 h-8 bg-primary rounded-full"></span>
                    {t('markets:eurobonds.headerTitle')}
                </h1>
                <p className="text-text-muted text-sm mt-2 ml-5">{t('markets:eurobonds.headerSubtitle')}</p>
            </div>

            <EurobondList bonds={bonds} loading={isLoading} />
          </div>
        </div>
    );
}
