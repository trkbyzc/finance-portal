import { LayoutGrid, Coins, Droplets, Wheat, Construction } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CommodityTabs({ activeCategory, setActiveCategory }) {
    const { t } = useTranslation('markets');
    const tabs = [
        { id: 'all', label: t('commodity.tabs.all'), icon: <LayoutGrid size={18} /> },
        { id: 'precious', label: t('commodity.tabs.preciousMetals'), icon: <Coins size={18} /> },
        { id: 'energy', label: t('commodity.tabs.energy'), icon: <Droplets size={18} /> },
        { id: 'agriculture', label: t('commodity.tabs.agriculture'), icon: <Wheat size={18} /> },
        { id: 'industrial', label: t('commodity.tabs.industrial'), icon: <Construction size={18} /> }
    ];

    return (
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all whitespace-nowrap text-xs font-bold uppercase tracking-wider
                        ${activeCategory === tab.id
                        ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(41,98,255,0.15)]'
                        : 'bg-surface border-border text-text-muted hover:border-primary/50 hover:text-text'
                    }`}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
