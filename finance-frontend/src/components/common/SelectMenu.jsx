import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Native <select> yerine tam stillenebilir dropdown.
 *
 * Native select'in açılan option listesi tarayıcı kontrolünde ve stillenemez (çirkin durur);
 * bu component buton + popover ile o sorunu çözer: seçili değeri gösteren buton, altında
 * stillenmiş liste, aktif seçenekte vurgulu highlight + tik. Dışarı tıkla / Escape ile kapanır.
 *
 * @param {{ value:any, onChange:(v:any)=>void, options:{value:any,label:string}[], placeholder?:string, className?:string }} props
 */
export default function SelectMenu({ value, onChange, options = [], placeholder = '', className = '' }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const selected = options.find((o) => o.value === value);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="w-full flex items-center justify-between gap-2 bg-bg border border-border rounded-lg px-4 py-3 text-left transition-colors hover:border-primary/50 focus:outline-none focus:border-primary"
            >
                <span className={`truncate ${selected ? 'text-text' : 'text-text-muted'}`}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown
                    size={18}
                    className={`text-text-muted shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <ul
                    role="listbox"
                    className="absolute z-50 mt-1.5 w-full max-h-60 overflow-y-auto rounded-lg border border-border bg-surface shadow-xl py-1"
                >
                    {options.map((o) => {
                        const active = o.value === value;
                        return (
                            <li key={String(o.value)}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={active}
                                    onClick={() => { onChange(o.value); setOpen(false); }}
                                    className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                                        active ? 'bg-primary/10 text-primary font-semibold' : 'text-text hover:bg-surface-hover'
                                    }`}
                                >
                                    <span className="truncate">{o.label}</span>
                                    {active && <Check size={16} className="shrink-0" />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
