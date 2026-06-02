import React, { useState, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { bondFundApi, historicalApi } from '../../../../services/api';
import { EMB_SYMBOL, SectionHeader } from './components/eurobondShared';
import EurobondKpiCards from './components/EurobondKpiCards';
import EurobondAggregateCharts from './components/EurobondAggregateCharts';
import EmbAreaChart from './components/EmbAreaChart';

/**
 * Eurobond dashboard'u — orchestrator.
 *
 * 3 ana query (eurobond list / EMB historical / aggregate stats) ve 3 alt section:
 *   - KPI cards (üst)
 *   - Aggregate charts (yıl bazlı stock, currency mix, maturity dağılımı)
 *   - EMB ETF area chart (range selector ile)
 */
export default function EurobondDashboard() {
    const navigate = useNavigate();
    const { t } = useTranslation(['markets', 'asset']);
    const [activeRange, setActiveRange] = useState('5y');

    const { data: eurobondList = [], isLoading: listLoading } = useQuery({
        queryKey: ['eurobond-list'],
        queryFn: async () => (await bondFundApi.getEurobondList()) || []
    });

    const { data: embHistory = [], isLoading: embLoading } = useQuery({
        queryKey: ['emb-chart', activeRange],
        queryFn: async () => {
            const res = await historicalApi.getData({ symbol: EMB_SYMBOL, category: 'EUROBOND', range: activeRange, interval: '1d' });
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

    const { data: aggregate, isLoading: aggLoading } = useQuery({
        queryKey: ['eurobond-aggregate'],
        queryFn: async () => (await bondFundApi.getEurobondAggregate()) || null
    });

    const embAsset = eurobondList[0] || null;

    const totalStockUsd = useMemo(() => {
        const arr = aggregate?.totalStockByYear || [];
        if (!arr.length) return null;
        const last = arr[arr.length - 1];
        return last?.value != null ? Number(last.value) : null;
    }, [aggregate]);

    const hasAggregate = aggregate &&
        ((aggregate.totalStockByYear?.length || 0) +
         (aggregate.currencyMix?.length || 0) +
         (aggregate.maturityMix?.length || 0)) > 0;

    const handleAssetClick = () => {
        if (!embAsset) return;
        navigate(`/chart/${encodeURIComponent(embAsset.symbol)}?cat=EUROBOND`);
    };

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
                    <span className="w-2 h-8 bg-primary rounded-full"></span>
                    {t('markets:eurobonds.headerTitle')}
                </h1>
            </div>

            <EurobondKpiCards
                embAsset={embAsset}
                listLoading={listLoading}
                aggregate={aggregate}
                aggLoading={aggLoading}
                hasAggregate={hasAggregate}
                totalStockUsd={totalStockUsd}
            />

            <SectionHeader title={t('markets:eurobonds.externalDebt')} sub="EVDS" />
            <EurobondAggregateCharts aggregate={aggregate} hasAggregate={hasAggregate} />

            <SectionHeader title="EMB ETF (USD EM Bond Proxy)" sub="iShares J.P. Morgan USD Emerging Markets Bond" />
            <EmbAreaChart
                activeRange={activeRange}
                setActiveRange={setActiveRange}
                embHistory={embHistory}
                embLoading={embLoading}
                embAsset={embAsset}
                onAssetClick={handleAssetClick}
            />
          </div>
        </div>
    );
}
