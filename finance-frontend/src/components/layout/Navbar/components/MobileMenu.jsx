import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronDown } from 'lucide-react';

/**
 * Mobile-only fullscreen menu. Navbar'dan navConfig + iki ekstra direkt link (news/economic-calendar) alır,
 * her kategoriyi accordion gibi açıp kapatabilen bir liste haline getirir.
 *
 * Açık iken body scroll lock, escape ile kapanır; route değiştiğinde de onClose tetiklenir.
 */
export default function MobileMenu({ open, onClose, navConfig, extraLinks }) {
    const [expanded, setExpanded] = useState(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] md:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div
                className="absolute top-0 right-0 h-full w-[85vw] max-w-sm bg-surface border-l border-border shadow-2xl overflow-y-auto flex flex-col"
                role="dialog"
                aria-label="Mobile navigation"
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-surface z-10">
                    <span className="text-sm font-bold uppercase tracking-wider text-text-muted">Menü</span>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-bg text-text-muted hover:text-text transition"
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-2 py-2">
                    {navConfig.map((cat, idx) => {
                        const isOpen = expanded === idx;
                        return (
                            <div key={idx} className="mb-1">
                                <button
                                    type="button"
                                    onClick={() => setExpanded(isOpen ? null : idx)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-bg text-text text-sm font-bold uppercase tracking-wider transition"
                                >
                                    <span>{cat.title}</span>
                                    <ChevronDown
                                        size={16}
                                        className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                {isOpen && (
                                    <div className="ml-2 mt-1 mb-2 border-l-2 border-border pl-2 flex flex-col gap-0.5">
                                        {cat.items.map((item, iIdx) => {
                                            if (item.type === 'divider') {
                                                return <div key={iIdx} className="h-px bg-border my-1.5 mx-2" />;
                                            }
                                            return (
                                                <Link
                                                    key={iIdx}
                                                    to={item.to}
                                                    onClick={onClose}
                                                    className="px-3 py-2 rounded-md hover:bg-bg text-sm flex flex-col gap-0.5 transition"
                                                >
                                                    <span style={item.accent ? { color: item.accent } : undefined} className="font-medium text-text">
                                                        {item.label}
                                                    </span>
                                                    {item.desc && (
                                                        <span className="text-[10px] text-text-muted uppercase tracking-wide">{item.desc}</span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div className="h-px bg-border my-3 mx-3" />

                    {extraLinks?.map((link, idx) => (
                        <Link
                            key={`extra-${idx}`}
                            to={link.to}
                            onClick={onClose}
                            className="block px-3 py-2.5 rounded-lg hover:bg-bg text-text text-sm font-bold uppercase tracking-wider transition"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    );
}
