import React from 'react';
import { Link } from 'react-router-dom';

export default function NavLogo() {
    return (
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <span className="font-black tracking-widest text-lg text-nav-text uppercase">
                FINANS<span className="text-primary group-hover:opacity-80 transition-opacity">PORTAL</span>
            </span>
        </Link>
    );
}
