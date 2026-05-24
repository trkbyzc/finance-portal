import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TickerItem({ name, price, change }) {
    const isPositive = change >= 0;
    const { i18n } = useTranslation();
    const locale = i18n.language?.startsWith('en') ? 'en-US' : 'tr-TR';

    return (
        <div className="flex items-center gap-2 shrink-0 px-6">
            <span className="text-text-muted text-sm font-semibold">{name}</span>
            <span className="text-text text-sm font-mono">{price?.toLocaleString(locale)}</span>
            <span className={`text-xs flex items-center font-mono font-bold ${isPositive ? 'text-buy' : 'text-sell'}`}>
                {isPositive ? <TrendingUp size={12} className="mr-0.5"/> : <TrendingDown size={12} className="mr-0.5"/>}
                {Math.abs(change || 0).toFixed(2)}%
            </span>
        </div>
    );
}
