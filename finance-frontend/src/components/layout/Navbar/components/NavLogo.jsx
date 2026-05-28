import React from 'react';
import { Link } from 'react-router-dom';

export default function NavLogo() {
    return (
        <Link to="/" className="flex items-center gap-2 min-w-0 shrink group">
            <span className="font-black tracking-normal sm:tracking-wider md:tracking-widest text-[13px] sm:text-base md:text-lg text-nav-text uppercase whitespace-nowrap">
                FINANS<span className="text-primary group-hover:opacity-80 transition-opacity">PORTAL</span>
            </span>
        </Link>
    );
}
