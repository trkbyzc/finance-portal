import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const PortfolioCharts = ({ portfolio, calculateProfitLoss }) => {
    // 🔍 DEBUG: Portfolio'yu konsola yazdır
    console.log('📦 Portfolio Data:', portfolio);

    // Varlık türüne göre dağılım (Pie Chart için)
    const assetTypeDistribution = portfolio?.reduce((acc, item) => {
        const calc = calculateProfitLoss(item);

        // 🔍 DEBUG: Her varlık için hesaplama
        console.log(`📊 ${item.symbol} (${item.assetType}):`, {
            currentValue: calc.currentValue,
            currentPrice: calc.currentPrice,
            quantity: item.quantity
        });

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

    // 🔍 DEBUG: Dağılım sonucu
    console.log('📊 Asset Type Distribution:', assetTypeDistribution);

    // Varlık bazlı kar/zarar (Bar Chart için)
    const assetProfitLoss = portfolio?.map(item => {
        const calc = calculateProfitLoss(item);
        return {
            name: item.symbol,
            assetType: item.assetType, // 🎨 Varlık türünü ekle
            'Kar/Zarar': calc.profitLoss,
            'Yatırım': item.averagePrice * item.quantity,
            'Güncel Değer': calc.currentValue
        };
    }) || [];


    // Pie Chart renkleri
    const COLORS = ['#2962ff', '#089981', '#f23645', '#ff9800', '#9c27b0', '#00bcd4'];

    // Türkçe isimler
    const assetTypeNames = {
        'STOCK': 'Hisse',
        'CRYPTO': 'Kripto',
        'CURRENCY': 'Döviz',
        'COMMODITY': 'Emtia',
        'BOND': 'Tahvil',
        'FUND': 'Fon',
        'FUTURE': 'Vadeli'
    };

    // 🎨 YENİ: Varlık türüne göre renk döndüren fonksiyon
    const getColorByAssetType = (assetType) => {
        const typeIndex = Object.keys(assetTypeNames).indexOf(assetType);
        return COLORS[typeIndex % COLORS.length];
    };

    // Custom label renderer - daha iyi görünüm için
    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.05) return null; // %5'ten küçük dilimleri gösterme

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
            {/* Varlık Türü Dağılımı (Pie Chart) */}
            <div className="bg-[#1a1d29] rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Varlık Türü Dağılımı</h3>
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
                    <div className="h-[300px] flex items-center justify-center text-[#868993]">
                        Henüz varlık bulunmuyor
                    </div>
                )}
            </div>

            {/* Varlık Bazlı Kar/Zarar (Bar Chart) */}
            <div className="bg-[#1a1d29] rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Varlık Bazlı Kar/Zarar</h3>
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
                            <Bar dataKey="Kar/Zarar">
                                {assetProfitLoss.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getColorByAssetType(entry.assetType)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-[#868993]">
                        Henüz varlık bulunmuyor
                    </div>
                )}
            </div>

        </div>
    );
};

export default PortfolioCharts;
