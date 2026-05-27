import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ShieldCheck, Loader2, Filter } from 'lucide-react';

import { adminApi } from '../../services/api/adminApi';
import { useAuth } from '../../context/AuthContext';
import UserRow from './components/UserRow';
import BanModal from './components/BanModal';

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
    const { user: currentUser } = useAuth();
    const currentUserId = currentUser?.sub;

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

    const deleteMutation = useMutation({
        mutationFn: (userId) => adminApi.deleteUser(userId),
        onSuccess: invalidate
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

    const handleDelete = async (user) => {
        if (currentUserId && user.id === currentUserId) {
            alert(t('admin:toast.cannotDeleteSelf'));
            return;
        }
        if (!window.confirm(t('admin:users.confirmDelete', { username: user.username }))) return;
        try {
            const res = await deleteMutation.mutateAsync(user.id);
            alert(res?.keycloakDeleted ? t('admin:toast.deleted') : t('admin:toast.deletedKeycloakSkipped'));
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.message || t('admin:toast.error'));
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
                                        isSelf={currentUserId && u.id === currentUserId}
                                        onBan={() => setBanTarget(u)}
                                        onUnban={() => handleUnban(u)}
                                        onForceLogout={() => handleForceLogout(u)}
                                        onDelete={() => handleDelete(u)}
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
