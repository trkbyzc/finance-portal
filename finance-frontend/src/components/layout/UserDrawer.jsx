import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, User, Briefcase, ShieldCheck, LogOut, Bell, Settings, Star, LineChart as LineChartIcon, GitCompare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../profile/Avatar';
import useProfileAvatar from '../../hooks/useProfileAvatar';

export default function UserDrawer({ open, onClose }) {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation('navbar');

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const go = (path) => {
        navigate(path);
        onClose();
    };

    const initials = (user?.preferred_username || user?.username || user?.given_name || user?.name || '?');
    const avatarId = useProfileAvatar();

    return (
        <>
            <div
                onClick={onClose}
                className={`fixed inset-0 z-90 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
                    open ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            />

            <aside
                className={`fixed top-0 left-0 h-full w-80 bg-surface border-r border-border z-100 shadow-2xl transition-transform duration-250 ease-out flex flex-col ${
                    open ? 'translate-x-0' : '-translate-x-full'
                }`}
                role="dialog"
                aria-label={t('drawer.title')}
            >
                <div className="p-5 border-b border-border bg-linear-to-br from-primary/5 to-transparent">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar id={avatarId} fallbackInitials={initials} size={48} className="shadow-md" />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-text truncate">
                                    {user?.preferred_username || user?.given_name || t('drawer.defaultName')}
                                </h3>
                                <p className="text-text-muted text-xs truncate">{user?.email || '—'}</p>
                                {isAdmin && (
                                    <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-sell/10 text-sell border border-sell/30">
                                        <ShieldCheck size={9} /> {t('drawer.admin')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors -mr-1"
                            aria-label={t('drawer.title')}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    <DrawerItem
                        icon={User}
                        label={t('drawer.profile')}
                        sub={t('drawer.profileSub')}
                        onClick={() => go('/profile')}
                    />
                    <DrawerItem
                        icon={Briefcase}
                        label={t('drawer.portfolio')}
                        sub={t('drawer.portfolioSub')}
                        accent="buy"
                        onClick={() => go('/portfolio')}
                    />
                    <DrawerItem
                        icon={Star}
                        label={t('drawer.watchlist')}
                        sub={t('drawer.watchlistSub')}
                        accent="primary"
                        onClick={() => go('/watchlist')}
                    />
                    <DrawerItem
                        icon={LineChartIcon}
                        label={t('drawer.simulation')}
                        sub={t('drawer.simulationSub')}
                        accent="primary"
                        onClick={() => go('/simulation')}
                    />
                    <DrawerItem
                        icon={GitCompare}
                        label={t('drawer.whatIf')}
                        sub={t('drawer.whatIfSub')}
                        accent="primary"
                        onClick={() => go('/what-if')}
                    />
                    <DrawerItem
                        icon={Bell}
                        label={t('drawer.notifications')}
                        sub={t('drawer.notificationsSub')}
                        disabled
                    />
                    <DrawerItem
                        icon={Settings}
                        label={t('drawer.preferences')}
                        sub={t('drawer.preferencesSub')}
                        disabled
                    />

                    {isAdmin && (
                        <>
                            <div className="my-3 border-t border-border" />
                            <DrawerItem
                                icon={ShieldCheck}
                                label={t('drawer.adminPanel')}
                                sub={t('drawer.adminPanelSub')}
                                accent="sell"
                                onClick={() => go('/admin')}
                            />
                        </>
                    )}
                </nav>

                <div className="p-3 border-t border-border">
                    <button
                        onClick={() => { logout(); onClose(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sell hover:bg-sell/10 transition-colors group"
                    >
                        <div className="w-9 h-9 rounded-lg bg-sell/10 flex items-center justify-center border border-sell/20 group-hover:bg-sell/20 transition-colors">
                            <LogOut size={16} />
                        </div>
                        <span className="font-semibold text-sm">{t('drawer.logout')}</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

function DrawerItem({ icon: Icon, label, sub, onClick, accent, disabled }) {
    const accentClass = {
        primary: 'text-primary bg-primary/10 border-primary/20',
        buy: 'text-buy bg-buy/10 border-buy/20',
        sell: 'text-sell bg-sell/10 border-sell/20'
    }[accent] || 'text-text-muted bg-surface-2 border-border';

    return (
        <button
            onClick={!disabled ? onClick : undefined}
            disabled={disabled}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-surface-hover'
            }`}
        >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${accentClass} shrink-0`}>
                <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-text">{label}</div>
                {sub && <div className="text-[10px] text-text-muted truncate">{sub}</div>}
            </div>
        </button>
    );
}
