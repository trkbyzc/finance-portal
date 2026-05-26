import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, Ban, ShieldOff, LogOut, ShieldCheck, Loader2, Filter } from 'lucide-react';

import { adminApi } from '../../services/api/adminApi';
import { formatDate } from '../../utils/formatters/dateFormatter';

function useDebounced(value, delay = 350) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

const PAGE_SIZE = 20;

export default function AdminPage() {
    const { t } = useTranslation(['admin', 'common']);
    const queryClient = useQueryClient();

    // Filters
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounced(searchInput);
    const [roleFilter, setRoleFilter] = useState('');
    const [bannedFilter, setBannedFilter] = useState(''); // '', 'true', 'false'
    const [page, setPage] = useState(0);

    // Ban modal
    const [banTarget, setBanTarget] = useState(null); // user object
    const [banDuration, setBanDuration] = useState('30'); // '7' | '30' | '90' | 'permanent'

    // Reset to first page when filters change
    useEffect(() => { setPage(0); }, [debouncedSearch, roleFilter, bannedFilter]);

    const queryParams = useMemo(() => ({
        q: debouncedSearch || undefined,
        role: roleFilter || undefined,
        banned: bannedFilter === '' ? undefined : bannedFilter === 'true',
        page,
        size: PAGE_SIZE
    }), [debouncedSearch, roleFilter, bannedFilter, page]);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['admin-users', queryParams],
        queryFn: () => adminApi.getUsers(queryParams),
        keepPreviousData: true
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] });

    const banMutation = useMutation({
        mutationFn: async ({ userId, duration }) => {
            if (duration === 'permanent') return adminApi.banPermanent(userId);
            return adminApi.banUser(userId, parseInt(duration, 10));
        },
        onSuccess: invalidate
    });

    const unbanMutation = useMutation({
        mutationFn: (userId) => adminApi.unbanUser(userId),
        onSuccess: invalidate
    });

    const logoutMutation = useMutation({
        mutationFn: (userId) => adminApi.logoutAll(userId)
    });

    const handleBanConfirm = async () => {
        if (!banTarget) return;
        try {
            await banMutation.mutateAsync({ userId: banTarget.id, duration: banDuration });
            setBanTarget(null);
            setBanDuration('30');
        } catch (e) {
            console.error(e);
            alert(t('admin:toast.error'));
        }
    };

    const handleUnban = async (user) => {
        if (!window.confirm(`${user.username} — ${t('admin:users.actions.unban')}?`)) return;
        try {
            await unbanMutation.mutateAsync(user.id);
        } catch (e) {
            console.error(e);
            alert(t('admin:toast.error'));
        }
    };

    const handleForceLogout = async (user) => {
        if (!window.confirm(t('admin:users.confirmForceLogout', { username: user.username }))) return;
        try {
            const res = await logoutMutation.mutateAsync(user.id);
            if (res?.success) alert(t('admin:toast.loggedOut'));
            else alert(t('admin:toast.logoutFailed'));
        } catch (e) {
            console.error(e);
            alert(t('admin:toast.error'));
        }
    };

    const handleClearFilters = () => {
        setSearchInput('');
        setRoleFilter('');
        setBannedFilter('');
    };

    const users = data?.content || [];
    const totalElements = data?.totalElements || 0;
    const totalPages = data?.totalPages || 0;
    const currentPage = (data?.number ?? page) + 1;

    return (
        <div className="min-h-screen bg-bg text-text p-4 md:p-8">
            <div className="max-w-[1400px] mx-auto">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-sell/10 border border-sell/30 flex items-center justify-center text-sell">
                        <ShieldCheck size={20} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold">{t('admin:pageTitle')}</h1>
                </div>
                <p className="text-text-muted mb-6">{t('admin:pageSubtitle')}</p>

                {/* Filters */}
                <div className="bg-surface border border-border rounded-2xl p-4 md:p-5 mb-6">
                    <div className="flex items-center gap-2 mb-3 text-text-muted text-sm">
                        <Filter size={16} /> <span className="font-semibold">{t('admin:filters.title')}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-5 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder={t('admin:users.search')}
                                className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary"
                            />
                        </div>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="md:col-span-3 bg-bg border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary"
                        >
                            <option value="">{t('admin:filters.roleAll')}</option>
                            <option value="USER">{t('admin:filters.roleUser')}</option>
                            <option value="ADMIN">{t('admin:filters.roleAdmin')}</option>
                        </select>
                        <select
                            value={bannedFilter}
                            onChange={(e) => setBannedFilter(e.target.value)}
                            className="md:col-span-3 bg-bg border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary"
                        >
                            <option value="">{t('admin:filters.bannedAll')}</option>
                            <option value="true">{t('admin:filters.bannedYes')}</option>
                            <option value="false">{t('admin:filters.bannedNo')}</option>
                        </select>
                        <button
                            onClick={handleClearFilters}
                            className="md:col-span-1 bg-bg hover:bg-surface-hover border border-border rounded-lg px-3 py-2.5 transition flex items-center justify-center"
                            title={t('admin:filters.clear')}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Users table */}
                {isLoading && !data ? (
                    <div className="flex items-center justify-center py-20 text-text-muted">
                        <Loader2 className="animate-spin mr-3" size={22} />
                        <span>{t('common:status.loading')}</span>
                    </div>
                ) : isError ? (
                    <div className="bg-sell/10 border border-sell/30 rounded-xl p-6 text-sell">
                        {t('admin:toast.error')}
                    </div>
                ) : (
                    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                <tr className="border-b border-border text-text-muted text-[13px] bg-bg">
                                    <th className="p-4 font-normal">{t('admin:users.cols.username')}</th>
                                    <th className="p-4 font-normal">{t('admin:users.cols.email')}</th>
                                    <th className="p-4 font-normal">{t('admin:users.cols.role')}</th>
                                    <th className="p-4 font-normal">{t('admin:users.cols.status')}</th>
                                    <th className="p-4 font-normal text-right">{t('admin:users.cols.actions')}</th>
                                </tr>
                                </thead>
                                <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-text-muted">{t('common:status.noData')}</td>
                                    </tr>
                                ) : users.map((u) => (
                                    <UserRow
                                        key={u.id}
                                        user={u}
                                        onBan={() => setBanTarget(u)}
                                        onUnban={() => handleUnban(u)}
                                        onForceLogout={() => handleForceLogout(u)}
                                        t={t}
                                    />
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-border p-4 text-sm">
                                <span className="text-text-muted">
                                    {t('admin:pagination.showing', {
                                        from: page * PAGE_SIZE + 1,
                                        to: Math.min((page + 1) * PAGE_SIZE, totalElements),
                                        total: totalElements
                                    })}
                                </span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="px-4 py-1.5 rounded-lg bg-bg hover:bg-surface-hover border border-border transition disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {t('admin:pagination.prev')}
                                    </button>
                                    <span className="text-text-muted font-mono">
                                        {t('admin:pagination.pageOf', { page: currentPage, total: totalPages })}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={page + 1 >= totalPages}
                                        className="px-4 py-1.5 rounded-lg bg-bg hover:bg-surface-hover border border-border transition disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {t('admin:pagination.next')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {banTarget && (
                <BanModal
                    user={banTarget}
                    duration={banDuration}
                    onDurationChange={setBanDuration}
                    onConfirm={handleBanConfirm}
                    onClose={() => { setBanTarget(null); setBanDuration('30'); }}
                    isSubmitting={banMutation.isPending}
                    t={t}
                />
            )}
        </div>
    );
}

function UserRow({ user, onBan, onUnban, onForceLogout, t }) {
    const isPermanent = user.banPermanent;
    const tempActive = !isPermanent && user.bannedUntil && new Date(user.bannedUntil) > new Date();
    const isBanned = isPermanent || tempActive;

    const realmRoles = user.realmRoles || [];
    const hasRealmRoles = realmRoles.length > 0;

    return (
        <tr className="border-b border-border/50 hover:bg-surface-hover transition">
            <td className="p-4">
                <div className="font-semibold">{user.username}</div>
            </td>
            <td className="p-4 text-text-muted text-sm">{user.email || '—'}</td>
            <td className="p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                    {user.role && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            user.role === 'ADMIN'
                                ? 'bg-sell/10 text-sell border border-sell/30'
                                : 'bg-surface-2 text-text-muted border border-border'
                        }`}>
                            {user.role}
                        </span>
                    )}
                    {hasRealmRoles ? realmRoles.slice(0, 4).map(r => (
                        <span key={r} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            {r}
                        </span>
                    )) : null}
                </div>
            </td>
            <td className="p-4">
                {isPermanent ? (
                    <span className="text-xs font-bold px-2 py-1 rounded bg-sell/20 text-sell border border-sell/40">
                        {t('admin:badges.permanent')}
                    </span>
                ) : tempActive ? (
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-warning/10 text-warning border border-warning/30" style={{ '--color-warning': '#f59e0b' }}>
                        {t('admin:badges.tempUntil', { date: formatDate(user.bannedUntil) })}
                    </span>
                ) : (
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-buy/10 text-buy border border-buy/30">
                        {t('admin:users.active')}
                    </span>
                )}
            </td>
            <td className="p-4 text-right">
                <div className="inline-flex items-center gap-2">
                    {isBanned ? (
                        <button
                            onClick={onUnban}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-buy/10 hover:bg-buy/20 text-buy border border-buy/30 text-xs font-semibold transition"
                            title={t('admin:users.actions.unban')}
                        >
                            <ShieldOff size={14} /> {t('admin:users.actions.unban')}
                        </button>
                    ) : (
                        <button
                            onClick={onBan}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sell/10 hover:bg-sell/20 text-sell border border-sell/30 text-xs font-semibold transition"
                            title={t('admin:users.actions.ban')}
                        >
                            <Ban size={14} /> {t('admin:users.actions.ban')}
                        </button>
                    )}
                    <button
                        onClick={onForceLogout}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg hover:bg-surface-hover text-text-muted hover:text-text border border-border text-xs font-semibold transition"
                        title={t('admin:users.actions.forceLogout')}
                    >
                        <LogOut size={14} /> {t('admin:users.actions.forceLogout')}
                    </button>
                </div>
            </td>
        </tr>
    );
}

function BanModal({ user, duration, onDurationChange, onConfirm, onClose, isSubmitting, t }) {
    const options = [
        { value: '7', labelKey: 'admin:banModal.duration7' },
        { value: '30', labelKey: 'admin:banModal.duration30' },
        { value: '90', labelKey: 'admin:banModal.duration90' },
        { value: 'permanent', labelKey: 'admin:banModal.durationPermanent' }
    ];

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-text-muted hover:text-text">
                    <X size={20} />
                </button>
                <h2 className="text-xl font-bold mb-1">{t('admin:banModal.title')}</h2>
                <p className="text-text-muted text-sm mb-5">
                    {t('admin:banModal.subtitle', { username: user.username })}
                </p>

                <div className="space-y-2 mb-5">
                    {options.map(opt => (
                        <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                            duration === opt.value
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-border-strong'
                        }`}>
                            <input
                                type="radio"
                                name="duration"
                                value={opt.value}
                                checked={duration === opt.value}
                                onChange={(e) => onDurationChange(e.target.value)}
                                className="accent-primary"
                            />
                            <span className="font-semibold flex-1">{t(opt.labelKey)}</span>
                            {opt.value === 'permanent' && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-sell/10 text-sell border border-sell/30">
                                    !
                                </span>
                            )}
                        </label>
                    ))}
                </div>

                {duration === 'permanent' && (
                    <div className="bg-sell/10 border border-sell/30 rounded-lg p-3 mb-5 text-sell text-sm">
                        {t('admin:banModal.permanentWarning')}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-bg hover:bg-surface-hover border border-border font-semibold transition disabled:opacity-50"
                    >
                        {t('admin:banModal.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-sell hover:bg-sell/90 text-white font-semibold transition disabled:opacity-50"
                    >
                        {isSubmitting ? '…' : t('admin:banModal.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
}
