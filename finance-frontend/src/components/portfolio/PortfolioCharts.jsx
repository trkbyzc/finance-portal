import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

const PortfolioCharts = ({ portfolio, calculateProfitLoss }) => {
    const { t } = useTranslation(['portfolio', 'markets']);

    const assetTypeDistribution = portfolio?.reduce((acc, item) => {
        const calc = calculateProfitLoss(item);
        const existing = acc.find(a => a.name === item.assetType);

        if (existing) {
            existing.value += calc.currentValue;
        } else {
            acc.push({
                name: item.assetType,
                value: calc.currentValue
            });
        }

        return acc;
    }, []) || [];

    const assetProfitLoss = portfolio?.map(item => {
        const calc = calculateProfitLoss(item);
        return {
            name: item.symbol,
            assetType: item.assetType,
            'pnl': calc.profitLoss,
            'invested': item.averagePrice * item.quantity,
            'current': calc.currentValue
        };
    }) || [];

    const COLORS = ['#2962ff', '#089981', '#f23645', '#ff9800', '#9c27b0', '#00bcd4'];

    const assetTypeNames = {
        'STOCK': t('markets:categories.trStocks'),
        'CRYPTO': t('markets:categories.crypto'),
        'CURRENCY': t('markets:categories.currencies'),
        'COMMODITY': t('markets:categories.commodities'),
        'BOND': t('markets:categories.bonds'),
        'FUND': t('markets:categories.trFunds'),
        'FUTURE': t('markets:categories.viop')
    };

    const getColorByAssetType = (assetType) => {
        const typeIndex = Object.keys(assetTypeNames).indexOf(assetType);
        return COLORS[typeIndex % COLORS.length];
    };

    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.05) return null;

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                style={{ fontSize: '14px', fontWeight: 'bold' }}
            >
                {`${assetTypeNames[name] || name} ${(percent * 100).toFixed(1)}%`}
            </text>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-surface-2 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">{t('portfolio:charts.distribution')}</h3>
                {assetTypeDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={assetTypeDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={renderCustomLabel}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {assetTypeDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => `${value.toFixed(2)} ₺`}
                                labelFormatter={(name) => assetTypeNames[name] || name}
                                contentStyle={{
                                    backgroundColor: '#1a1d29',
                                    border: '1px solid #2a2e39',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                            <Legend
                                formatter={(value) => assetTypeNames[value] || value}
                                wrapperStyle={{ color: '#868993' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-text-muted">
                        {t('portfolio:holdings.noHoldings')}
                    </div>
                )}
            </div>

            <div className="bg-surface-2 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">{t('portfolio:stats.totalPnl')}</h3>
                {assetProfitLoss.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={assetProfitLoss}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" />
                            <XAxis
                                dataKey="name"
                                stroke="#868993"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                stroke="#868993"
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip
                                formatter={(value) => `${value.toFixed(2)} ₺`}
                                contentStyle={{
                                    backgroundColor: '#1a1d29',
                                    border: '1px solid #2a2e39',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                            <Legend wrapperStyle={{ color: '#868993' }} />
                            <Bar dataKey="pnl" name={t('portfolio:stats.totalPnl')}>
                                {assetProfitLoss.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getColorByAssetType(entry.assetType)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-text-muted">
                        {t('portfolio:holdings.noHoldings')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PortfolioCharts;
