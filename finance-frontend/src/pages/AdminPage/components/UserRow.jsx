import React from 'react';
import { Ban, ShieldOff, LogOut, Trash2, ShieldCheck } from 'lucide-react';
import { formatDate } from '../../../utils/formatters/dateFormatter';

/**
 * Admin paneli kullanıcı tablosu satırı — ban/unban + force-logout + delete butonları.
 * AdminPage'ten extract edildi; sayfa sadece data + handler'ları geçirir.
 */
export default function UserRow({ user, isSelf, onBan, onUnban, onForceLogout, onDelete, t }) {
    const isPermanent = user.banPermanent;
    const tempActive = !isPermanent && user.bannedUntil && new Date(user.bannedUntil) > new Date();
    const isBanned = isPermanent || tempActive;

    const realmRoles = user.realmRoles || [];
    const hasRealmRoles = realmRoles.length > 0;
    const isOrphan = !hasRealmRoles;
    // Yöneticiler korumalı — banlama/oturum kapatma/silme aksiyonları gösterilmez
    const isAdmin = user.role === 'ADMIN';

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
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-warning/10 text-warning border border-warning/30">
                        {t('admin:badges.tempUntil', { date: formatDate(user.bannedUntil) })}
                    </span>
                ) : (
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-buy/10 text-buy border border-buy/30">
                        {t('admin:users.active')}
                    </span>
                )}
            </td>
            <td className="p-4 text-right">
                {isAdmin ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/30 text-xs font-semibold">
                        <ShieldCheck size={14} /> {t('admin:users.protected')}
                    </span>
                ) : (
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
                        disabled={isOrphan}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg hover:bg-surface-hover text-text-muted hover:text-text border border-border text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                        title={isOrphan ? "Keycloak'ta yok" : t('admin:users.actions.forceLogout')}
                    >
                        <LogOut size={14} /> {t('admin:users.actions.forceLogout')}
                    </button>
                    <button
                        onClick={onDelete}
                        disabled={isSelf}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-sell hover:bg-sell/10 border border-border transition disabled:opacity-40 disabled:cursor-not-allowed"
                        title={isSelf ? t('admin:toast.cannotDeleteSelf') : t('admin:users.actions.delete')}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
                )}
            </td>
        </tr>
    );
}
