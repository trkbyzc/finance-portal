import React from 'react';
import { TrendingUp, TrendingDown, Wallet, PieChart } from 'lucide-react';

const PortfolioStats = ({ portfolio, calculateProfitLoss }) => {
    // Toplam yatırım tutarı (alış fiyatı * miktar)
    const totalInvestment = portfolio?.reduce((sum, item) => {
        return sum + (item.averagePrice * item.quantity);
    }, 0) || 0;

    // Güncel toplam değer
    const totalValue = portfolio?.reduce((sum, item) => {
        const calc = calculateProfitLoss(item);
        return sum + calc.currentValue;
    }, 0) || 0;

    // Toplam kar/zarar
    const totalProfitLoss = totalValue - totalInvestment;

    // Getiri oranı (%)
    const returnRate = totalInvestment > 0
        ? ((totalProfitLoss / totalInvestment) * 100)
        : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Toplam Yatırım */}
            <div className="bg-[#1a1d29] rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                    <Wallet size={20} className="text-[#868993]" />
                    <p className="text-[#868993] text-sm">Toplam Yatırım</p>
                </div>
                <p className="text-2xl font-bold">{totalInvestment.toFixed(2)} ₺</p>
            </div>

            {/* Güncel Değer */}
            <div className="bg-[#1a1d29] rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                    <PieChart size={20} className="text-[#868993]" />
                    <p className="text-[#868993] text-sm">Güncel Değer</p>
                </div>
                <p className="text-2xl font-bold">{totalValue.toFixed(2)} ₺</p>
            </div>

            {/* Toplam Kar/Zarar */}
            <div className="bg-[#1a1d29] rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                    {totalProfitLoss >= 0 ? (
                        <TrendingUp size={20} className="text-[#089981]" />
                    ) : (
                        <TrendingDown size={20} className="text-[#f23645]" />
                    )}
                    <p className="text-[#868993] text-sm">Toplam Kar/Zarar</p>
                </div>
                <p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                    {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toFixed(2)} ₺
                </p>
            </div>

            {/* Getiri Oranı */}
            <div className="bg-[#1a1d29] rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                    {returnRate >= 0 ? (
                        <TrendingUp size={20} className="text-[#089981]" />
                    ) : (
                        <TrendingDown size={20} className="text-[#f23645]" />
                    )}
                    <p className="text-[#868993] text-sm">Getiri Oranı</p>
                </div>
                <p className={`text-2xl font-bold ${returnRate >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                    {returnRate >= 0 ? '+' : ''}{returnRate.toFixed(2)}%
                </p>
            </div>
        </div>
    );
};

export default PortfolioStats;
