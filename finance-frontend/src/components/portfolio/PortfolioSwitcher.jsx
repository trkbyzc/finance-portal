import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Pencil, Trash2, Wallet, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Çoklu adlandırılmış portföy seçici. Aktif portföyü gösterir; menüden geçiş,
 * yeni oluşturma, yeniden adlandırma ve silme yapılır.
 */
export default function PortfolioSwitcher({ portfolios, activeId, onSelect, onCreate, onRename, onDelete }) {
    const { t } = useTranslation(['portfolio', 'common']);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    const active = portfolios.find(p => p.id === activeId) || portfolios[0];

    const handleCreate = () => {
        const name = window.prompt(t('portfolio:switcher.createPrompt', 'Yeni portföy adı:'));
        if (name && name.trim()) onCreate(name.trim());
        setOpen(false);
    };
    const handleRename = (p) => {
        const name = window.prompt(t('portfolio:switcher.renamePrompt', 'Yeni ad:'), p.name);
        if (name && name.trim() && name.trim() !== p.name) onRename(p.id, name.trim());
    };
    const handleDelete = (p) => {
        if (window.confirm(t('portfolio:switcher.deleteConfirm', `"${p.name}" portföyü ve içindeki varlıklar silinecek. Emin misiniz?`))) {
            onDelete(p.id);
        }
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
        </div>
    );
}
