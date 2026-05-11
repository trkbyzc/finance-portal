import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function TickerItem({ name, price, change }) {
    const isPositive = change >= 0;

    return (
        <div className="flex items-center gap-2 shrink-0 px-6">
            <span className="text-[#c8cbd1] text-sm font-semibold">{name}</span>
            <span className="text-white text-sm">{price.toLocaleString('tr-TR')}</span>
            <span className={`text-xs flex items-center font-medium ${isPositive ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                {isPositive ? <TrendingUp size={12} className="mr-0.5"/> : <TrendingDown size={12} className="mr-0.5"/>}
                {Math.abs(change).toFixed(2)}%
            </span>
        </div>
    );
}