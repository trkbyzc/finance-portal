import { useTranslation } from 'react-i18next';

export const COMMODITY_CATEGORIES = {
    'Tümü': [],
    'Kıymetli Madenler': ['GC=F', 'SI=F', 'PL=F', 'PA=F'],
    'Enerji': ['CL=F', 'BZ=F', 'NG=F'],
    'Sanayi Metalleri': ['HG=F'],
    'Tarım': ['ZW=F', 'ZC=F', 'KC=F', 'CC=F', 'CT=F']
};

const CATEGORY_LABEL_KEYS = {
    'Tümü': 'commodity.tabs.all',
    'Kıymetli Madenler': 'commodity.tabs.preciousMetals',
    'Enerji': 'commodity.tabs.energy',
    'Sanayi Metalleri': 'commodity.tabs.industrial',
    'Tarım': 'commodity.tabs.agriculture'
};

export default function MarketCategoryTabs({ activeTab, setActiveTab }) {
    const { t } = useTranslation('markets');
    return (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar">
            {Object.keys(COMMODITY_CATEGORIES).map((cat) => (
                <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-300 ${
                        activeTab === cat
                            ? 'bg-primary text-text shadow-[0_0_15px_rgba(41,98,255,0.3)]'
                            : 'bg-surface text-text-muted border border-border hover:text-text hover:border-border-strong'
                    }`}
                >
                    {t(CATEGORY_LABEL_KEYS[cat] || cat)}
                </button>
            ))}
        </div>
    );
}
