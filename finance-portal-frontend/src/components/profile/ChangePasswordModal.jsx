import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, KeyRound, Eye, EyeOff, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { userApi } from '../../services/api/userApi';
import { useNotify } from '../../context/NotificationContext';

/**
 * Self-service şifre değiştirme modal'ı.
 * Backend: POST /api/v1/users/me/password { oldPassword, newPassword }.
 * Frontend validation: yeni şifre min 8, yenilerin eşleşmesi, eskisinden farklı.
 */
export default function ChangePasswordModal({ open, onClose }) {
    const { t } = useTranslation(['profile', 'common']);
    const notify = useNotify();

    const [oldPwd, setOldPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [show, setShow] = useState({ old: false, new: false, confirm: false });
    const [submitting, setSubmitting] = useState(false);
    const [localError, setLocalError] = useState(null);

    // Kapanırken form'u sıfırla — useEffect yerine onClose wrapper'ı (lint dostu).
    const handleClose = useCallback(() => {
        setOldPwd(''); setNewPwd(''); setConfirmPwd('');
        setLocalError(null);
        setShow({ old: false, new: false, confirm: false });
        onClose();
    }, [onClose]);

    useEffect(() => {
        if (!open) return;
        const h = (e) => { if (e.key === 'Escape' && !submitting) handleClose(); };
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, [open, submitting, handleClose]);

    if (!open) return null;

    const validate = () => {
        if (newPwd.length < 8) return t('profile:passwordModal.tooShort');
        if (newPwd !== confirmPwd) return t('profile:passwordModal.mismatch');
        if (newPwd === oldPwd && oldPwd.length > 0) return t('profile:passwordModal.sameAsOld');
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validate();
        if (err) { setLocalError(err); return; }
        setLocalError(null);
        setSubmitting(true);
        try {
            await userApi.changePassword(oldPwd, newPwd);
            notify({ type: 'success', title: t('profile:passwordModal.success') });
            handleClose();
        } catch (e2) {
            const serverMsg = e2?.response?.data?.message;
            notify({
                type: 'error',
                title: t('profile:passwordModal.error'),
                message: serverMsg || ''
            });
            setLocalError(serverMsg || t('profile:passwordModal.error'));
        } finally {
            setSubmitting(false);
        }
    };

    const canSubmit = oldPwd && newPwd && confirmPwd && !submitting;

    return (
        <div
            onClick={() => !submitting && handleClose()}
            className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in"
            >
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                            <KeyRound size={16} />
                        </div>
                        <h2 className="text-base font-bold text-text">{t('profile:passwordModal.title')}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover disabled:opacity-40 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <PasswordField
                        label={t('profile:passwordModal.oldPassword')}
                        value={oldPwd}
                        onChange={setOldPwd}
                        visible={show.old}
                        onToggleVisible={() => setShow(s => ({ ...s, old: !s.old }))}
                        autoFocus
                    />
                    <PasswordField
                        label={t('profile:passwordModal.newPassword')}
                        value={newPwd}
                        onChange={setNewPwd}
                        visible={show.new}
                        onToggleVisible={() => setShow(s => ({ ...s, new: !s.new }))}
                    />
                    <PasswordField
                        label={t('profile:passwordModal.newPasswordConfirm')}
                        value={confirmPwd}
                        onChange={setConfirmPwd}
                        visible={show.confirm}
                        onToggleVisible={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                    />

                    <p className="flex items-start gap-1.5 text-[11px] text-text-muted">
                        <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-buy" />
                        {t('profile:passwordModal.rules')}
                    </p>

                    {localError && (
                        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-sell/10 border border-sell/30 text-sell text-xs">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                            <span>{localError}</span>
                        </div>
                    )}

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 py-2.5 rounded-lg border border-border text-text hover:bg-surface-hover text-sm font-semibold disabled:opacity-40 transition-colors"
                        >
                            {t('profile:passwordModal.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-fg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md shadow-primary/25"
                        >
                            {submitting && <Loader2 className="animate-spin" size={14} />}
                            {t('profile:passwordModal.submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function PasswordField({ label, value, onChange, visible, onToggleVisible, autoFocus }) {
    return (
        <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">{label}</label>
            <div className="relative">
                <input
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoFocus={autoFocus}
                    autoComplete="new-password"
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-primary"
                />
                <button
                    type="button"
                    onClick={onToggleVisible}
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-text-muted hover:text-text transition-colors"
                    aria-label={visible ? 'hide' : 'show'}
                >
                    {visible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
            </div>
        </div>
    );
}
