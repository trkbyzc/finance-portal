import React from 'react';
import { useTranslation } from 'react-i18next';

export default function NewsCategoryTabs({ categories, activeCategory, setActiveCategory }) {
    const { t } = useTranslation('news');
    return (
        <div className="flex gap-3 overflow-x-auto pb-4 mb-10 scrollbar-hide border-b border-border">
            {categories.map(cat => (
                <button
                    key={cat.value}
                    onClick={() => setActiveCategory(cat.value)}
                    className={`whitespace-nowrap px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeCategory === cat.value ? 'bg-primary text-text' : 'bg-surface text-text-muted hover:bg-surface-2'
                    }`}
                >
                    {t(cat.tKey)}
                </button>
            ))}
        </div>
    );
}
