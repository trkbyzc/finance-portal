import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Native window.prompt yerine özelleştirilebilir, tema-uyumlu metin giriş modalı.
export default function PromptModal({
    open, title, label, placeholder = '', defaultValue = '', confirmText, onSubmit, onCancel
}) {
    const { t } = useTranslation('common');
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) {
            setValue(defaultValue);
            // setTimeout: modal DOM'a mount olduktan sonra focus alabilmesi için bir tick beklenir
            const id = setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 30);
            return () => clearTimeout(id);
        }
    }, [open, defaultValue]);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onCancel?.(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onCancel]);

    if (!open) return null;

    const submit = (e) => {
        e.preventDefault();
        const v = value.trim();
        if (v) onSubmit?.(v);
    };

    return (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in">
                <div className="flex justify-between items-center p-5 border-b border-border">
                    <h3 className="text-lg font-bold text-text">{title}</h3>
                    <button
                        onClick={onCancel}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
                        aria-label={t('actions.cancel')}
                    >
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={submit} className="p-5">
                    {label && <label className="block text-text-muted text-[11px] uppercase tracking-wider font-bold mb-2">{label}</label>}
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
                    />
                    <div className="flex gap-3 mt-5">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 rounded-lg font-bold text-text bg-surface-2 hover:bg-surface-hover border border-border transition-all"
                        >
                            {t('actions.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={!value.trim()}
                            className="flex-1 px-4 py-2.5 rounded-lg font-bold text-primary-fg bg-primary hover:bg-primary-hover transition-all shadow-md disabled:opacity-50"
                        >
                            {confirmText || t('actions.confirm')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
