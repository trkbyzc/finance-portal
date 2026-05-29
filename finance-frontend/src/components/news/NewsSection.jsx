import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ExternalLink, Newspaper, ImageOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNewsData } from '../../hooks/useNewsData';
import { formatDateTime } from '../../utils/formatters/dateFormatter';

const ACCENT_CLASSES = {
    primary: { icon: 'text-primary', border: 'hover:border-primary', btnHover: 'hover:bg-primary', bg: 'bg-primary/10' },
    buy:     { icon: 'text-buy',     border: 'hover:border-buy',     btnHover: 'hover:bg-buy',     bg: 'bg-buy/10'     },
    warning: { icon: 'text-warning', border: 'hover:border-warning', btnHover: 'hover:bg-warning', bg: 'bg-warning/10' },
    sell:    { icon: 'text-sell',    border: 'hover:border-sell',    btnHover: 'hover:bg-sell',    bg: 'bg-sell/10'    }
};

/**
 * Sayfa altına gelecek full-width haber bölümü.
 *
 * @param {string} category - Backend NewsCategoryClassifier sabiti (örn. 'Borsa', 'Kripto').
 * @param {string} titleKey - i18n key (örn. 'news:categories.stock').
 * @param {string} accent - 'primary' | 'buy' | 'warning' | 'sell'
 * @param {number} limit - Gösterilecek haber sayısı (default: 6).
 * @param {string} className - Ek class'lar; varsayılan `mt-8`'i override etmek için
 *                              (örn. flex-col gap parent'ı kullanan sayfalarda mt çakışmasın).
 */
export default function NewsSection({ category, titleKey, accent = 'primary', limit = 6, className = 'mt-8' }) {
    const navigate = useNavigate();
    const { t } = useTranslation(['news', 'common']);
    const { news, loading } = useNewsData(category);
    const styles = ACCENT_CLASSES[accent] || ACCENT_CLASSES.primary;

    const items = (news || []).slice(0, limit);

    return (
        <div className={`bg-surface border border-border rounded-2xl shadow-2xl p-6 ${className}`}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <h2 className="text-xl font-bold text-text flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${styles.bg} flex items-center justify-center ${styles.icon}`}>
                        <Newspaper size={20} />
                    </div>
                    {t(titleKey)}
                </h2>
                <button
                    onClick={() => navigate('/news')}
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-border bg-surface-2 ${styles.icon} ${styles.border} transition-colors flex items-center gap-1.5`}
                >
                    {t('common:actions.viewAll')} <ExternalLink size={12} />
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: limit }).map((_, i) => (
                        <div key={i} className="h-32 animate-pulse bg-surface-2 rounded-xl border border-border" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="py-12 text-center text-text-muted">
                    <Newspaper size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{t('common:status.noData')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item, idx) => (
                        <div
                            key={`${item.link || idx}-${idx}`}
                            onClick={() => navigate('/news/detail', { state: { newsItem: item } })}
                            className={`group cursor-pointer p-4 rounded-xl bg-surface-2 border border-border ${styles.border} transition-all flex gap-3`}
                        >
                            <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-border bg-bg flex items-center justify-center">
                                {item.imageUrl ? (
                                    <img
                                        src={item.imageUrl}
                                        alt=""
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center text-border"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 2l20 20M8.5 8.5l.01 0M19 19H5a2 2 0 01-2-2V7"/></svg></div>'; }}
                                    />
                                ) : (
                                    <ImageOff size={24} className="text-border" />
                                )}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
                                <h3 className="text-sm font-bold text-text group-hover:text-text line-clamp-3 leading-snug">
                                    {item.title}
                                </h3>
                                <div className="flex items-center justify-between text-[10px] text-text-muted font-bold uppercase tracking-tight mt-2">
                                    <span className={`${styles.icon} truncate max-w-[100px]`}>{item.source}</span>
                                    <span className="flex items-center gap-1 shrink-0">
                                        <Clock size={10} /> {formatDateTime(item.pubDate)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
