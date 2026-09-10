import { useMemo, useState } from 'react';
import { ArrowLeft, Landmark, ChevronRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { bondFundApi } from '../../../../services/api';
import NewsSection from '../../../../components/news/NewsSection.jsx';

const BUCKET_ORDER = ['SHORT', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y10'];
const fmtMaturity = (iso) => {
    if (!iso || iso.length < 10) return iso || '—';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
};

// Vadesi geçmiş (matured) DİBS'in canlı grafiği olmaz → listede gösterme.
// Dinamik: demo günü itibarıyla vadesi dolan tüm tahviller otomatik gizlenir.
const isMatured = (iso) => {
    if (!iso || iso.length < 10) return false; // tarihsizi gizleme (güvenli taraf)
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
};

/**
 * Türkiye Hazine tahvil/bono (DİBS) dashboard'u — vade kategorili.
 * Üstte vade kovaları (Tümü, Kısa Vadeli, 1+..10+ Yıl), altında tablo.
 * Satıra tıklayınca DİBS detay sayfası açılır (/chart/TP.<ISIN>?cat=TR_BOND).
 */
export default function TurkishBondsDashboard() {
    const navigate = useNavigate();
    const { t } = useTranslation(['markets', 'common', 'asset']);
    const [activeBucket, setActiveBucket] = useState('all');
    const [query, setQuery] = useState('');

    const { data: bonds = [], isLoading } = useQuery({
        queryKey: ['tr-bonds-catalog'],
        queryFn: async () => (await bondFundApi.getTrBondsCatalog()) || []
    });

    // Vadesi geçmiş tahvilleri en baştan ele (hem sekmeler hem liste canlı tahvilleri görsün).
    const liveBonds = useMemo(() => bonds.filter(b => !isMatured(b.maturity)), [bonds]);

    const tabs = useMemo(() => {
        const byBucket = new Map();
        for (const b of liveBonds) if (!byBucket.has(b.bucket)) byBucket.set(b.bucket, b.label || b.bucket);
        const ordered = BUCKET_ORDER.filter(k => byBucket.has(k)).map(k => ({ id: k, label: byBucket.get(k) }));
        return [{ id: 'all', label: t('markets:trBonds.all') }, ...ordered];
    }, [liveBonds, t]);

    const filtered = useMemo(() => {
        let arr = liveBonds;
        if (activeBucket !== 'all') arr = arr.filter(b => b.bucket === activeBucket);
        const q = query.trim().toLowerCase();
        if (q) arr = arr.filter(b => (b.name || '').toLowerCase().includes(q) || (b.isin || '').toLowerCase().includes(q));
        return arr;
    }, [liveBonds, activeBucket, query]);

    return (
        <div className="min-h-screen bg-bg text-text">
          <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-text-muted hover:text-text mb-6 transition bg-surface-2 px-4 py-2 rounded-lg border border-border"
            >
                <ArrowLeft size={18} /> {t('asset:back')}
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-text tracking-tight flex items-center gap-3">
                        <span className="w-2 h-8 bg-primary rounded-full"></span>
                        {t('markets:trBonds.headerTitle')}
                    </h1>
                </div>
                <div className="relative w-full md:w-80">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        type="text"
                        placeholder={t('markets:common.searchPlaceholder')}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-surface border border-border focus:border-primary text-text rounded-xl outline-none text-sm transition shadow-lg"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveBucket(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all whitespace-nowrap text-xs font-bold uppercase tracking-wider ${
                            activeBucket === tab.id
                                ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(41,98,255,0.15)]'
                                : 'bg-surface border-border text-text-muted hover:border-primary/50 hover:text-text'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-border bg-surface-2/50 flex items-center gap-3">
                    <Landmark className="text-primary" size={20} />
                    <h2 className="text-lg font-bold text-text tracking-tight">{t('markets:trBonds.headerTitle')}</h2>
                </div>
                <div className="overflow-x-auto max-h-175 custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-150">
                        <thead className="bg-surface-2 sticky top-0 z-10 shadow-md">
                        <tr>
                            <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider">{t('markets:trBonds.cols.bond')}</th>
                            <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('markets:trBonds.cols.maturity')}</th>
                            <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right hidden sm:table-cell">{t('markets:trBonds.cols.group')}</th>
                            <th className="p-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('markets:trBonds.cols.yield')}</th>
                            <th className="p-5"></th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2e39]">
                        {isLoading ? (
                            <tr><td colSpan="5" className="p-10 text-center text-text-muted">{t('common:status.loading')}</td></tr>
                        ) : !filtered.length ? (
                            <tr><td colSpan="5" className="p-10 text-center text-text-muted">{t('markets:common.noResults')}</td></tr>
                        ) : (
                            filtered.map((b) => (
                                <tr
                                    key={b.symbol}
                                    onClick={() => navigate(`/chart/${encodeURIComponent(b.symbol)}?cat=TR_BOND`)}
                                    className="hover:bg-surface-2 transition cursor-pointer group"
                                >
                                    <td className="p-5">
                                        <div className="font-bold text-text group-hover:text-primary transition">{b.name}</div>
                                        <div className="text-[11px] text-text-muted font-mono">{b.isin}</div>
                                    </td>
                                    <td className="p-5 text-right font-mono text-sm text-text whitespace-nowrap">{fmtMaturity(b.maturity)}</td>
                                    <td className="p-5 text-right text-xs text-text-muted hidden sm:table-cell whitespace-nowrap">{b.label}</td>
                                    <td className="p-5 text-right font-mono text-sm font-bold text-primary whitespace-nowrap">
                                        {b.yield != null ? `%${Number(b.yield).toFixed(2)}` : '—'}
                                    </td>
                                    <td className="p-5 text-right">
                                        <ChevronRight size={18} className="text-text-muted group-hover:text-primary transition" />
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="mt-3 text-[11px] text-text-muted">{t('markets:trBonds.yieldNote')}</p>

            <NewsSection
                category="Tahvil & Faiz"
                titleKey="news:categories.bond"
                accent="primary"
                limit={5}
                gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
            />
          </div>
        </div>
    );
}
