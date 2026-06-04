import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function TickerItem({ name, price, change, symbol, category }) {
    const isPositive = change >= 0;
    const { i18n } = useTranslation();
    const locale = i18n.language?.startsWith('en') ? 'en-US' : 'tr-TR';
    const navigate = useNavigate();

    const target = symbol
        ? (category
            ? `/chart/${encodeURIComponent(symbol)}?cat=${category}`
            : `/chart/${encodeURIComponent(symbol)}`)
        : null;

    const handleClick = () => { if (target) navigate(target); };
    const handleKey = (e) => { if (target && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); navigate(target); } };

    return (
        <div
            onClick={handleClick}
            onKeyDown={handleKey}
            role={target ? 'button' : undefined}
            tabIndex={target ? 0 : undefined}
            title={target ? name : undefined}
            className={`flex items-center gap-2 shrink-0 px-6 transition-colors ${
                target ? 'cursor-pointer group/ticker hover:text-primary' : ''
            }`}
        >
            <span className={`text-text-muted text-sm font-semibold ${target ? 'group-hover/ticker:text-primary' : ''}`}>{name}</span>
            <span className="text-text text-sm font-mono">{price?.toLocaleString(locale)}</span>
            <span className={`text-xs flex items-center font-mono font-bold ${isPositive ? 'text-buy' : 'text-sell'}`}>
                {isPositive ? <TrendingUp size={12} className="mr-0.5"/> : <TrendingDown size={12} className="mr-0.5"/>}
                {Math.abs(change || 0).toFixed(2)}%
            </span>
        </div>
    );
}
