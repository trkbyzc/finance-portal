import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, Briefcase, Bitcoin, DollarSign, Gem, Landmark, PieChart, GitCompare } from 'lucide-react';

const TYPE_META = {
    ALL:       { i18nKey: 'portfolio:tabs.all',       icon: Layers,    color: '#64748b' },
    STOCK:     { i18nKey: 'common:assetTypes.STOCK',  icon: Briefcase, color: '#3b82f6' },
    CRYPTO:    { i18nKey: 'common:assetTypes.CRYPTO', icon: Bitcoin,   color: '#f59e0b' },
    CURRENCY:  { i18nKey: 'common:assetTypes.CURRENCY', icon: DollarSign, color: '#10b981' },
    COMMODITY: { i18nKey: 'common:assetTypes.COMMODITY', icon: Gem,    color: '#eab308' },
    BOND:      { i18nKey: 'common:assetTypes.BOND',   icon: Landmark,  color: '#8b5cf6' },
    FUND:      { i18nKey: 'common:assetTypes.FUND',   icon: PieChart,  color: '#ec4899' },
    FUTURE:    { i18nKey: 'markets:categories.viop',  icon: GitCompare, color: '#06b6d4' }
};

const PortfolioTabs = ({ tabs, counts, activeTab, onChange }) => {
    const { t } = useTranslation(['portfolio', 'common', 'markets']);

    return (
        <div className="flex flex-wrap items-center gap-2 mb-6 p-1.5 bg-surface-2 border border-border rounded-xl">
            {tabs.map((type) => {
                const meta = TYPE_META[type];
                if (!meta) return null;
                const Icon = meta.icon;
                const active = activeTab === type;
                const count = counts[type] ?? 0;
                return (
                    <button
                        key={type}
                        type="button"
                        onClick={() => onChange(type)}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition border ${
                            active
                                ? 'text-text shadow-sm'
                                : 'border-transparent text-text-muted hover:text-text hover:bg-bg'
                        }`}
                        style={active ? {
                            background: `${meta.color}1a`,
                            borderColor: `${meta.color}66`
                        } : {}}
                    >
                        <Icon size={15} style={{ color: meta.color }} />
                        <span>{t(meta.i18nKey)}</span>
                        <span
                            className="text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center"
                            style={{
                                background: active ? meta.color : 'var(--color-border)',
                                color: active ? '#fff' : 'var(--color-text-muted)'
                            }}
                        >
                            {count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default PortfolioTabs;
