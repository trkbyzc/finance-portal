import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function NavDropdown({ title, items }) {
    return (
        <div className="relative group cursor-pointer">
            <div className="flex items-center gap-1 hover:text-white transition py-5 font-bold uppercase">
                {title}
                <ChevronDown size={16} className="group-hover:rotate-180 transition-transform duration-300" />
            </div>
            <div className="absolute top-full left-0 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 -mt-1">
                <div className="bg-[#131722] border border-[#2a2e39] rounded-lg shadow-2xl py-2 flex flex-col">
                    {items.map((item, idx) => (
                        <React.Fragment key={idx}>
                            {item.type === 'divider' ? (
                                <div className="h-px bg-[#2a2e39] my-1 mx-2" />
                            ) : item.submenu ? (
                                <div className="relative group/submenu cursor-pointer">
                                    <div className="px-4 py-2.5 hover:bg-[#2a2e39] hover:text-white transition flex items-center justify-between">
                                        <span>{item.label}</span>
                                        <ChevronRight size={16} className="text-[#868993] group-hover/submenu:text-white transition-colors" />
                                    </div>
                                    <div className="absolute top-0 left-full ml-0.5 w-56 opacity-0 invisible group-hover/submenu:opacity-100 group-hover/submenu:visible transition-all duration-300 z-50">
                                        <div className="bg-[#131722] border border-[#2a2e39] rounded-lg shadow-2xl py-2 flex flex-col">
                                            {item.submenu.map((sub, sIdx) => (
                                                <Link key={sIdx} to={sub.to} className="px-4 py-2.5 hover:bg-[#2a2e39] hover:text-white transition flex flex-col">
                                                    <span>{sub.label}</span>
                                                    {sub.desc && <span className="text-[10px] text-[#868993] font-normal uppercase">{sub.desc}</span>}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Link to={item.to} className="px-4 py-2.5 hover:bg-[#2a2e39] hover:text-white transition flex flex-col gap-0.5 group/item">
                                    <span className={`font-bold ${item.color || ''} transition-colors`}>{item.label}</span>
                                    {item.desc && <span className="text-[10px] text-[#868993] font-normal uppercase">{item.desc}</span>}
                                </Link>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}