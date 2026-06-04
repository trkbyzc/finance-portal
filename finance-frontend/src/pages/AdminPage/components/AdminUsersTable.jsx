import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import UserRow from './UserRow';

const PAGE_SIZE = 20;

/**
 * Admin user listesi tablosu + pagination + loading/error state'leri.
 * Aksiyon callback'leri (ban/unban/forceLogout/delete) parent'tan gelir.
 */
export default function AdminUsersTable({
    data, isLoading, isError,
    page, setPage,
    currentUserId,
    onBan, onUnban, onForceLogout, onDelete
}) {
    const { t } = useTranslation(['admin', 'common']);

    const users = data?.content || [];
    const totalElements = data?.totalElements || 0;
    const totalPages = data?.totalPages || 0;
    const currentPage = (data?.number ?? page) + 1;

    if (isLoading && !data) {
        return (
            <div className="flex items-center justify-center py-20 text-text-muted">
                <Loader2 className="animate-spin mr-3" size={22} />
                <span>{t('common:status.loading')}</span>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-sell/10 border border-sell/30 rounded-xl p-6 text-sell">
                {t('admin:toast.error')}
            </div>
        );
    }

    return (
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
                            onBan={() => onBan(u)}
                            onUnban={() => onUnban(u)}
                            onForceLogout={() => onForceLogout(u)}
                            onDelete={() => onDelete(u)}
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
    );
}
