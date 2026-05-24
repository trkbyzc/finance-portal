import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Top-nav dropdown — theme-aware (semantic tokens kullanır)
 * Hover'da açılır, divider'lar ve nested submenu desteği var.
 */
export default function NavDropdown({ title, items }) {
    return (
        <div className="relative group">
            <button
                type="button"
                className="flex items-center gap-1 px-2 py-2 text-[12px] font-bold uppercase tracking-wider text-nav-text/70 hover:text-nav-text transition-colors cursor-pointer"
            >
                {title}
                <ChevronDown size={14} className="opacity-60 group-hover:rotate-180 transition-transform duration-200" />
            </button>

            <div className="absolute top-full left-0 w-64 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-150 z-50 pt-1">
                <div className="bg-surface border border-border rounded-xl shadow-2xl shadow-black/20 py-1.5 flex flex-col overflow-hidden">
                    {items.map((item, idx) => (
                        <React.Fragment key={idx}>
                            {item.type === 'divider' ? (
                                <div className="h-px bg-border my-1 mx-3" />
                            ) : item.submenu ? (
                                <div className="relative group/submenu">
                                    <div className="px-3 py-2 mx-1 rounded-md hover:bg-surface-hover transition-colors flex items-center justify-between cursor-pointer">
                                        <span className="text-sm font-medium text-text">{item.label}</span>
                                        <ChevronRight size={14} className="text-text-muted group-hover/submenu:text-primary transition-colors" />
                                    </div>
                                    <div className="absolute top-0 left-full ml-1 w-56 opacity-0 invisible group-hover/submenu:opacity-100 group-hover/submenu:visible transition-all duration-150 z-50">
                                        <div className="bg-surface border border-border rounded-xl shadow-2xl shadow-black/20 py-1.5 flex flex-col">
                                            {item.submenu.map((sub, sIdx) => (
                                                <Link
                                                    key={sIdx}
                                                    to={sub.to}
                                                    className="px-3 py-2 mx-1 rounded-md hover:bg-surface-hover transition-colors flex flex-col gap-0.5"
                                                >
                                                    <span className="text-sm font-medium text-text">{sub.label}</span>
                                                    {sub.desc && (
                                                        <span className="text-[10px] text-text-muted font-medium uppercase tracking-wide">{sub.desc}</span>
                                                    )}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    to={item.to}
                                    className="px-3 py-2 mx-1 rounded-md hover:bg-surface-hover transition-colors flex flex-col gap-0.5 group/item"
                                >
                                    <span className={`text-sm font-medium ${item.color ? '' : 'text-text'}`} style={item.accent ? { color: item.accent } : undefined}>
                                        {item.label}
                                    </span>
                                    {item.desc && (
                                        <span className="text-[10px] text-text-muted font-medium uppercase tracking-wide">{item.desc}</span>
                                    )}
                                </Link>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}
