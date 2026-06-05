import { ChevronRight, Clock, ImageOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { detectCategoryFromSymbol } from '../../../utils/categoryUtils';
import { formatPercent } from '../../../utils/formatters/numberFormatter';
import { formatDateTime } from '../../../utils/formatters/dateFormatter';
import { useNewsData } from '../../../hooks/useNewsData';
import { MarketTableSkeleton } from '../../../components/ui/Skeleton';
import NewsAssetChip from '../../../components/news/NewsAssetChip';
import AssetIcon from '../../../components/asset/AssetIcon';

const TAB_TO_CATEGORY = {
    stocks: 'STOCK',
    'us-stocks': 'STOCK',
    'tr-stocks': 'STOCK',
    crypto: 'CRYPTO',
    currencies: 'CURRENCY',
    commodities: 'COMMODITY',
    bonds: 'BOND',
    funds: 'FUND',
    'tr-funds': 'TR_FUND',
    'global-funds': 'FUND',
    viop: 'VIOP',
    indices: 'INDEX'
};

export default function DashboardTabPanel({ tabs, activeTab, setActiveTab, tabData, tabLoading, navigate }) {
    const tabCategory = TAB_TO_CATEGORY[activeTab] || null;
    const { t, i18n } = useTranslation('dashboard');
    const locale = i18n.language?.startsWith('en') ? 'en-US' : 'tr-TR';
    const isNewsTab = activeTab === 'news';

    const { news, loading: newsLoading } = useNewsData('Tümü');
    const newsItems = (news || []).slice(0, 12);

    const activeTabTitle = tabs.find(tb => tb.id === activeTab)?.title || '';
    const viewAllLabel = isNewsTab
        ? t('tabs.viewAllNews')
        : i18n.language?.startsWith('en')
            ? `View All ${activeTabTitle} →`
            : `Tüm ${activeTabTitle} Piyasasını Gör →`;

    const showLoading = isNewsTab ? newsLoading : tabLoading;

    return (
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-linear-to-br from-primary/20 via-transparent to-buy/20 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none" />

            <div className="relative bg-surface border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col h-105">
                <div className="flex bg-surface-2 border-b border-border overflow-x-auto hide-scrollbar">
                    {tabs.map(tab => {
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3.5 text-[11px] font-bold tracking-wider uppercase transition-all border-b-2 whitespace-nowrap ${
                                    active
                                        ? 'text-primary border-primary bg-primary/5'
                                        : 'text-text-muted border-transparent hover:text-text hover:bg-surface-hover'
                                }`}
                            >
                                {tab.icon} {tab.title}
                            </button>
                        );
                    })}
                </div>

                <div className="flex-1 overflow-y-auto hide-scrollbar">
                    {showLoading ? (
                        <MarketTableSkeleton rows={6} />
                    ) : isNewsTab ? (
                        /* HABERLER sekmesi — ayrı haber listesi */
                        <div className="divide-y divide-border/40">
                            {newsItems.map((item, i) => (
                                <div
                                    key={`${item.link || i}-${i}`}
                                    onClick={() => navigate('/news/detail', { state: { newsItem: item } })}
                                    className="flex items-center gap-3 p-3 pl-4 hover:bg-surface-hover cursor-pointer transition-colors group/row"
                                >
                                    <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-border bg-bg flex items-center justify-center">
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <ImageOff size={18} className="text-border" />
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-xs font-bold text-text line-clamp-2 leading-snug group-hover/row:text-primary transition-colors">
                                            {item.title}
                                        </span>
                                        <div className="flex items-center gap-2 text-[10px] text-text-muted font-bold uppercase tracking-tight mt-1">
                                            <span className="text-primary truncate max-w-30">{item.source}</span>
                                            <span className="flex items-center gap-1 shrink-0">
                                                <Clock size={10} /> {formatDateTime(item.pubDate)}
                                            </span>
                                            <NewsAssetChip item={item} className="ml-auto" />
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="shrink-0 text-border group-hover/row:text-primary transition-colors" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-border/40">
                            {tabData.map((asset, i) => {
                                const symbol = asset.symbol || asset.currencyCode;
                                const price = asset.price || asset.forexSelling;
                                const cat = asset.assetCategory || tabCategory || detectCategoryFromSymbol(symbol) || '';
                                const target = cat
                                    ? `/chart/${encodeURIComponent(symbol)}?cat=${cat}`
                                    : `/chart/${encodeURIComponent(symbol)}`;
                                const isUp = (asset.changePercent || 0) >= 0;
                                return (
                                    <tr
                                        key={i}
                                        onClick={() => navigate(target)}
                                        className="hover:bg-surface-hover cursor-pointer transition-colors group/row"
                                    >
                                        <td className="p-3.5 pl-4">
                                            <div className="flex items-center gap-2.5">
                                                <AssetIcon src={asset.image} symbol={symbol} size={28} />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-text group-hover/row:text-primary transition-colors">{symbol}</span>
                                                    <span className="text-[10px] text-text-muted truncate max-w-45">{asset.name || asset.currencyName}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3.5 text-right font-mono text-sm font-semibold text-text">
                                            {price != null ? price.toLocaleString(locale) : '-'}
                                        </td>
                                        <td className={`p-3.5 text-right font-mono text-xs font-bold ${isUp ? 'text-buy' : 'text-sell'}`}>
                                            {formatPercent(asset.changePercent || 0)}
                                        </td>
                                        <td className="pr-4 text-right text-border group-hover/row:text-primary transition-colors">
                                            <ChevronRight size={16}/>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    )}
                </div>

                <button
                    onClick={() => {
                        if (isNewsTab) { navigate('/news'); return; }
                        const targetCategory = activeTab === 'stocks' ? 'tr-stocks' : activeTab;
                        navigate(`/markets/${targetCategory}/list`);
                    }}
                    className="bg-surface-2 p-3 text-[10px] font-black text-text-muted hover:text-primary border-t border-border transition-colors uppercase tracking-widest"
                >
                    {viewAllLabel}
                </button>
            </div>
        </div>
    );
}
