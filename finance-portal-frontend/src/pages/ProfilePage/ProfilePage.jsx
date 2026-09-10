import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, User, Mail, Shield, KeyRound, CheckCircle2, IdCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/profile/Avatar';
import AvatarPickerModal from '../../components/profile/AvatarPickerModal';
import ChangePasswordModal from '../../components/profile/ChangePasswordModal';
import useProfileAvatar from '../../hooks/useProfileAvatar';

const InfoCard = ({ icon: Icon, label, value, accent }) => (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-start gap-3 transition hover:border-border-strong">
        <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${accent}1a`, color: accent }}
        >
            <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-0.5">{label}</div>
            <div className="text-text font-semibold truncate">{value || '—'}</div>
        </div>
    </div>
);

const ProfilePage = () => {
    const { user } = useAuth();
    const { t } = useTranslation(['profile', 'common']);
    const avatarId = useProfileAvatar();
    const [pickerOpen, setPickerOpen] = useState(false);
    const [passwordOpen, setPasswordOpen] = useState(false);

    const displayName = user?.name || user?.username || '—';
    const initials = (user?.username || user?.name || '?');

    return (
        <div className="min-h-screen bg-bg p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold mb-1">{t('profile:pageTitle')}</h1>
                <p className="text-text-muted mb-8">{t('profile:pageSubtitle')}</p>

                <div className="relative bg-surface-2 border border-border rounded-2xl p-6 mb-6 overflow-hidden">
                    <div
                        className="absolute inset-x-0 top-0 h-32 pointer-events-none"
                        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(139,92,246,0.10) 50%, transparent 100%)' }}
                    />
                    <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
                        <div className="relative">
                            <Avatar id={avatarId} fallbackInitials={initials} size={104} className="ring-4 ring-surface-2" />
                            <button
                                onClick={() => setPickerOpen(true)}
                                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary hover:bg-primary-hover text-primary-fg flex items-center justify-center shadow-lg transition"
                                title={t('profile:avatar.change', 'Avatarı değiştir')}
                                aria-label={t('profile:avatar.change', 'Avatarı değiştir')}
                            >
                                <Camera size={16} />
                            </button>
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h2 className="text-2xl font-bold">{displayName}</h2>
                            <p className="text-text-muted text-sm mb-3">@{user?.username || '—'}</p>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-buy/10 text-buy text-xs font-semibold border border-buy/30">
                                <CheckCircle2 size={12} />
                                {t('common:status.active')}
                            </div>
                            {user?.isAdmin && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/30 ml-2">
                                    <Shield size={12} />
                                    {t('profile:roles.admin')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mb-2">
                    <h3 className="text-xs uppercase tracking-wider text-text-muted font-bold mb-3">
                        {t('profile:sections.info')}
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                    <InfoCard
                        icon={User}
                        label={t('profile:fields.username')}
                        value={user?.username}
                        accent="#3b82f6"
                    />
                    <InfoCard
                        icon={Mail}
                        label={t('profile:fields.email')}
                        value={user?.email}
                        accent="#10b981"
                    />
                    <InfoCard
                        icon={IdCard}
                        label={t('profile:fields.fullName')}
                        value={user?.name}
                        accent="#f59e0b"
                    />
                    <InfoCard
                        icon={Shield}
                        label={t('profile:fields.role')}
                        value={user?.isAdmin ? t('profile:roles.admin') : t('profile:roles.user')}
                        accent="#8b5cf6"
                    />
                </div>

                <div className="mb-2">
                    <h3 className="text-xs uppercase tracking-wider text-text-muted font-bold mb-3">
                        {t('profile:sections.security')}
                    </h3>
                </div>
                <div className="bg-surface border border-border rounded-xl p-5">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                            <KeyRound size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold mb-0.5">{t('profile:actions.changePassword')}</div>
                            <div className="text-sm text-text-muted mb-3">
                                {t('profile:security.passwordHint', 'Şifreni güvenli bir şekilde değiştirmek için yeni sekmede Keycloak hesap konsolu açılır.')}
                            </div>
                            <button
                                type="button"
                                onClick={() => setPasswordOpen(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-fg rounded-lg text-sm font-semibold transition"
                            >
                                <KeyRound size={14} />
                                {t('profile:actions.changePassword')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <AvatarPickerModal
                open={pickerOpen}
                currentId={avatarId}
                onClose={() => setPickerOpen(false)}
            />
            <ChangePasswordModal
                open={passwordOpen}
                onClose={() => setPasswordOpen(false)}
            />
        </div>
    );
};

export default ProfilePage;
