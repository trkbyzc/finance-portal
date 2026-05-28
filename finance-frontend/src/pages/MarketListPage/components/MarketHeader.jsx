import React from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function MarketHeader({ title, searchTerm, setSearchTerm, navigate }) {
    const { t } = useTranslation(['markets', 'asset']);
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-text-muted hover:text-text mb-4 transition bg-surface-2 px-3 py-1.5 rounded-lg border border-border text-sm"
                >
                    <ArrowLeft size={16} /> {t('asset:back')}
                </button>
                <h1 className="text-2xl sm:text-3xl font-black uppercase text-text tracking-tight">{title}</h1>
            </div>
            <div className="relative w-full md:w-72">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                    type="text"
                    placeholder={t('markets:common.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-border rounded-xl outline-none text-sm text-text focus:border-primary transition"
                />
            </div>
        </div>
    );
}
