import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../config/apiClient';
import { formatDate } from '../../utils/formatters/dateFormatter';

export default function AdminPage() {
    const { t } = useTranslation(['admin', 'common']);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await apiClient.get('/admin/users');
            setUsers(response || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setLoading(false);
        }
    };

    const handleBan = async (userId, username, currentBanStatus) => {
        if (currentBanStatus) {
            if (window.confirm(`${username} — ${t('admin:users.actions.unban')}?`)) {
                try {
                    await apiClient.post(`/admin/users/${userId}/unban`);
                    fetchUsers();
                } catch (error) {
                    console.error(error);
                    alert(t('common:status.error'));
                }
            }
        } else {
            const days = window.prompt(`${username} — ${t('admin:users.actions.ban')} (${t('common:time.days')})`, "30");

            if (days && !isNaN(days)) {
                try {
                    await apiClient.post(`/admin/users/${userId}/ban?days=${days}`);
                    fetchUsers();
                } catch (error) {
                    console.error(error);
                    alert(t('common:status.error'));
                }
            }
        }
    };

    if (loading) {
        return <div className="text-center p-10 text-text">{t('common:status.loading')}</div>;
    }

    return (
        <div className="p-10 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-red-500">{t('admin:pageTitle')}</h1>

            <div className="bg-surface rounded-lg border border-border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-surface-2 text-text-muted text-sm uppercase">
                    <tr>
                        <th className="py-4 px-6 border-b border-border">{t('admin:users.cols.username')}</th>
                        <th className="py-4 px-6 border-b border-border">{t('admin:users.cols.email')}</th>
                        <th className="py-4 px-6 border-b border-border">{t('admin:users.cols.status')}</th>
                        <th className="py-4 px-6 border-b border-border">{t('common:labels.date')}</th>
                        <th className="py-4 px-6 border-b border-border text-right">{t('admin:users.cols.actions')}</th>
                    </tr>
                    </thead>
                    <tbody className="text-text text-sm divide-y divide-[#2a2e39]">
                    {users && users.length > 0 ? (
                        users.map((user) => (
                            <tr key={user.id} className="hover:bg-surface-2/50 transition">
                                <td className="py-4 px-6 font-semibold">{user.username}</td>
                                <td className="py-4 px-6">{user.email || '-'}</td>


                                <td className="py-4 px-6">
                                    {user.banned
                                        ? <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs">{t('common:status.banned')}</span>
                                        : <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs">{t('common:status.active')}</span>
                                    }
                                </td>
                                <td className="py-4 px-6 text-text-muted">
                                    {user.bannedUntil ? formatDate(user.bannedUntil) : '-'}
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <button
                                        onClick={() => handleBan(user.id, user.username, user.banned)}
                                        className={`px-4 py-1.5 rounded font-semibold transition ${
                                            user.banned
                                                ? 'bg-primary hover:bg-primary-hover text-text'
                                                : 'bg-red-600 hover:bg-red-700 text-text'
                                        }`}
                                    >
                                        {user.banned ? t('admin:users.actions.unban') : t('admin:users.actions.ban')}
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="py-8 text-center text-text-muted">{t('common:status.noData')}</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
