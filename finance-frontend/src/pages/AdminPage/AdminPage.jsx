import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';

import { adminApi } from '../../services/api/adminApi';
import { useAuth } from '../../context/AuthContext';
import BanModal from './components/BanModal';
import AdminFilters from './components/AdminFilters';
import AdminUsersTable from './components/AdminUsersTable';

const PAGE_SIZE = 20;

function useDebounced(value, delay = 350) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

/**
 * Admin paneli — orchestrator.
 *
 * Filters + table + ban modal'ı kompoze eder. Mutations + business logic (ban/unban/forceLogout/delete
 * confirm akışları) burada; UI parçaları AdminFilters, AdminUsersTable, BanModal'a delege edildi.
 */
export default function AdminPage() {
    const { t } = useTranslation(['admin', 'common']);
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();
    const currentUserId = currentUser?.sub;

    // Filters
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounced(searchInput);
    const [roleFilter, setRoleFilter] = useState('');
    const [bannedFilter, setBannedFilter] = useState('');
    const [page, setPage] = useState(0);

    // Ban modal
    const [banTarget, setBanTarget] = useState(null);
    const [banDuration, setBanDuration] = useState('30');

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

    return (
        <div className="min-h-screen bg-bg text-text p-4 md:p-8">
            <div className="max-w-[1400px] mx-auto">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-sell/10 border border-sell/30 flex items-center justify-center text-sell">
                        <ShieldCheck size={20} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{t('admin:pageTitle')}</h1>
                </div>
                <p className="text-text-muted mb-6">{t('admin:pageSubtitle')}</p>

                <AdminFilters
                    searchInput={searchInput}
                    onSearchInputChange={setSearchInput}
                    roleFilter={roleFilter}
                    onRoleFilterChange={setRoleFilter}
                    bannedFilter={bannedFilter}
                    onBannedFilterChange={setBannedFilter}
                    onClear={handleClearFilters}
                />

                <AdminUsersTable
                    data={data}
                    isLoading={isLoading}
                    isError={isError}
                    page={page}
                    setPage={setPage}
                    currentUserId={currentUserId}
                    onBan={setBanTarget}
                    onUnban={handleUnban}
                    onForceLogout={handleForceLogout}
                    onDelete={handleDelete}
                />
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
