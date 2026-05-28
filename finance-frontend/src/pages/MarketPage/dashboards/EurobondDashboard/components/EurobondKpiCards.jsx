import React from 'react';
import { TrendingUp, BarChart3, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../../../../utils/formatters/dateFormatter';
import { KpiCard } from './eurobondShared';

/**
 * Üst 3 KPI kartı: EMB ETF son fiyat, toplam stock USD, son güncelleme tarihi.
 */
export default function EurobondKpiCards({ embAsset, listLoading, aggregate, aggLoading, hasAggregate, totalStockUsd }) {
    const { t } = useTranslation(['markets', 'common']);
    const lastPrice = embAsset?.price ? Number(embAsset.price) : null;
    const lastChange = embAsset?.changePercent != null ? Number(embAsset.changePercent) : null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <KpiCard
                icon={<TrendingUp size={20} />}
                label="EMB ETF"
                value={lastPrice != null ? `$${lastPrice.toFixed(2)}` : '—'}
                sub={lastChange != null
                    ? `${lastChange >= 0 ? '+' : ''}${lastChange.toFixed(2)}% ${t('common:time.today')}`
                    : (listLoading ? t('common:status.loading') : t('common:status.noData'))}
                subColor={lastChange != null ? (lastChange >= 0 ? '#089981' : '#f23645') : '#868993'}
                accent="#ff9800"
            />
            <KpiCard
                icon={<BarChart3 size={20} />}
                label={t('markets:eurobonds.totalStock')}
                value={totalStockUsd != null ? `${(totalStockUsd / 1000).toFixed(1)}B USD` : '—'}
                sub={hasAggregate ? t('common:labels.lastUpdated') : (aggLoading ? t('common:status.loading') : 'EVDS')}
                subColor="#868993"
                accent="#2962ff"
            />
            <KpiCard
                icon={<Calendar size={20} />}
                label={t('common:labels.lastUpdated')}
                value={aggregate?.lastUpdated ? formatDate(aggregate.lastUpdated) : '—'}
                sub="EVDS / FRED"
                subColor="#868993"
                accent="#089981"
            />
        </div>
    );
}
