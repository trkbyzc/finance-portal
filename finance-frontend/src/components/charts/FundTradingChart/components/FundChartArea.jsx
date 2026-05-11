import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0b0e14] border border-[#2a2e39] p-3 rounded-xl shadow-2xl">
                <p className="text-[#868993] text-xs font-bold mb-1">{label}</p>
                <p className="text-[#2962ff] text-lg font-mono font-black">
                    {payload[0].value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    <span className="text-[10px] text-[#868993] ml-1">TRY</span>
                </p>
            </div>
        );
    }
    return null;
};

export default function FundChartArea({ chartData, loading }) {
    // Veri kontrolü
    const hasData = chartData && Array.isArray(chartData) && chartData.length > 0;
    
    return (
        <div className="flex-1 relative bg-[#131722] p-4">
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0b0e14]/60 backdrop-blur-sm">
                    <Loader2 className="animate-spin text-[#2962ff]" size={40} />
                </div>
            )}

            {!loading && !hasData && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-[#868993] text-sm">Veri bulunamadı</p>
                </div>
            )}

            {hasData && (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2962ff" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#2962ff" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2e39" />
                        <XAxis dataKey="dateStr" stroke="#868993" tick={{ fontSize: 11 }} tickMargin={10} minTickGap={30} axisLine={false} tickLine={false} />
                        <YAxis stroke="#868993" domain={['dataMin', 'dataMax']} orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(val) => val.toFixed(2)} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="close" stroke="#2962ff" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" activeDot={{ r: 6, fill: '#fff', stroke: '#2962ff', strokeWidth: 2 }} />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}