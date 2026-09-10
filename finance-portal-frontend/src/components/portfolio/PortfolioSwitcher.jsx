import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Pencil, Trash2, Wallet, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PromptModal from '../layout/PromptModal';
import Modal from '../layout/Modal';

/**
 * Çoklu adlandırılmış portföy seçici. Aktif portföyü gösterir; menüden geçiş,
 * yeni oluşturma, yeniden adlandırma ve silme yapılır.
 */
export default function PortfolioSwitcher({ portfolios, activeId, onSelect, onCreate, onRename, onDelete }) {
    const { t } = useTranslation(['portfolio', 'common']);
    const [open, setOpen] = useState(false);
    // { mode: 'create' | 'rename', portfolio? } | null
    const [prompt, setPrompt] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const ref = useRef(null);

    useEffect(() => {
        const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    const active = portfolios.find(p => p.id === activeId) || portfolios[0];

    const handleCreate = () => {
        setPrompt({ mode: 'create' });
        setOpen(false);
    };
    const handleRename = (p) => setPrompt({ mode: 'rename', portfolio: p });
    const handleDelete = (p) => setDeleteTarget(p);

    const submitPrompt = (name) => {
        if (prompt?.mode === 'create') {
            onCreate(name);
        } else if (prompt?.mode === 'rename' && name !== prompt.portfolio.name) {
            onRename(prompt.portfolio.id, name);
        }
        setPrompt(null);
    };

    const confirmDelete = () => {
        if (deleteTarget) onDelete(deleteTarget.id);
        setDeleteTarget(null);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-2 hover:bg-surface-hover border border-border text-text font-semibold transition"
            >
                <Wallet size={18} className="text-primary" />
                <span className="max-w-[180px] truncate">{active?.name || t('portfolio:pageTitle')}</span>
                <ChevronDown size={16} className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute left-0 mt-2 w-72 bg-surface border border-border rounded-xl shadow-2xl z-50 p-2">
                    <div className="max-h-72 overflow-y-auto custom-scrollbar">
                        {portfolios.map(p => (
                            <div
                                key={p.id}
                                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer group ${p.id === activeId ? 'bg-primary/10' : 'hover:bg-surface-2'}`}
                                onClick={() => { onSelect(p.id); setOpen(false); }}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    {p.id === activeId ? <Check size={15} className="text-primary shrink-0" /> : <span className="w-[15px] shrink-0" />}
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-text truncate">{p.name}</div>
                                        <div className="text-[10px] text-text-muted">{p.itemCount} {t('portfolio:switcher.assets', 'varlık')}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <button onClick={(e) => { e.stopPropagation(); handleRename(p); }} title={t('portfolio:switcher.rename', 'Yeniden adlandır')} className="p-1 rounded text-text-muted hover:text-primary">
                                        <Pencil size={14} />
                                    </button>
                                    {portfolios.length > 1 && (
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(p); }} title={t('portfolio:switcher.delete', 'Sil')} className="p-1 rounded text-text-muted hover:text-sell">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={handleCreate}
                        className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-primary hover:bg-primary/10 border-t border-border"
                    >
                        <Plus size={16} /> {t('portfolio:switcher.create', 'Yeni Portföy')}
                    </button>
                </div>
            )}

            <PromptModal
                open={!!prompt}
                title={prompt?.mode === 'rename'
                    ? t('portfolio:switcher.rename', 'Yeniden adlandır')
                    : t('portfolio:switcher.create', 'Yeni Portföy')}
                label={prompt?.mode === 'rename'
                    ? t('portfolio:switcher.renamePrompt', 'Yeni ad:')
                    : t('portfolio:switcher.createPrompt', 'Yeni portföy adı:')}
                placeholder={t('portfolio:switcher.namePlaceholder', 'Örn. Uzun Vade')}
                defaultValue={prompt?.mode === 'rename' ? prompt.portfolio.name : ''}
                confirmText={prompt?.mode === 'rename' ? t('common:actions.save') : t('common:actions.create', 'Oluştur')}
                onSubmit={submitPrompt}
                onCancel={() => setPrompt(null)}
            />

            <Modal
                isOpen={!!deleteTarget}
                type="error"
                title={t('portfolio:switcher.delete', 'Sil')}
                message={t('portfolio:switcher.deleteConfirm', '"{{name}}" portföyü ve içindeki varlıklar silinecek. Emin misiniz?', { name: deleteTarget?.name })}
                confirmText={t('common:actions.delete', 'Sil')}
                showCancel
                onCancel={() => setDeleteTarget(null)}
                onClose={confirmDelete}
            />
        </div>
    );
}
