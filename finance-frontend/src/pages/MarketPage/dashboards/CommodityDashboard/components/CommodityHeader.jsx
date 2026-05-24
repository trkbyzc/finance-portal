import React from 'react';
import { Search, Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CommodityHeader({ searchQuery, setSearchQuery }) {
    const { t } = useTranslation('markets');
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
                <h1 className="text-3xl font-black uppercase text-text tracking-tight flex items-center gap-3">
                    <span className="w-2 h-8 bg-warning rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]"></span>
                    {t('commodity.headerTitle')}
                </h1>
                <p className="text-text-muted text-sm mt-2 ml-5 flex items-center gap-2">
                    <Compass size={16} className="text-warning" /> {t('commodity.headerSubtitle')}
                </p>
            </div>

            <div className="relative w-full md:w-80">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                    type="text"
                    placeholder={t('common.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface border border-border focus:border-warning text-text rounded-xl outline-none text-sm transition shadow-lg"
                />
            </div>
        </div>
    );
}
