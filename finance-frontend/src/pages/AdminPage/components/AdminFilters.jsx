import { Search, Filter, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Admin sayfasındaki user filtreleri — username/email arama (parent'ta debounce), rol seçici,
 * banned seçici ve "Temizle" butonu.
 *
 * Parent (AdminPage) state'i tutar; bu component sadece UI + change event'leri yayar.
 */
export default function AdminFilters({
    searchInput, onSearchInputChange,
    roleFilter, onRoleFilterChange,
    bannedFilter, onBannedFilterChange,
    onClear
}) {
    const { t } = useTranslation('admin');

    return (
        <div className="bg-surface border border-border rounded-2xl p-4 md:p-5 mb-6">
            <div className="flex items-center gap-2 mb-3 text-text-muted text-sm">
                <Filter size={16} /> <span className="font-semibold">{t('filters.title')}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => onSearchInputChange(e.target.value)}
                        placeholder={t('users.search')}
                        className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => onRoleFilterChange(e.target.value)}
                    className="md:col-span-3 bg-bg border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary"
                >
                    <option value="">{t('filters.roleAll')}</option>
                    <option value="USER">{t('filters.roleUser')}</option>
                    <option value="ADMIN">{t('filters.roleAdmin')}</option>
                </select>
                <select
                    value={bannedFilter}
                    onChange={(e) => onBannedFilterChange(e.target.value)}
                    className="md:col-span-3 bg-bg border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary"
                >
                    <option value="">{t('filters.bannedAll')}</option>
                    <option value="true">{t('filters.bannedYes')}</option>
                    <option value="false">{t('filters.bannedNo')}</option>
                </select>
                <button
                    onClick={onClear}
                    className="md:col-span-1 bg-bg hover:bg-surface-hover border border-border rounded-lg px-3 py-2.5 transition flex items-center justify-center"
                    title={t('filters.clear')}
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
