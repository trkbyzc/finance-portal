import React from 'react';
import { Link } from 'react-router-dom';

export default function NavLogo() {
    return (
        <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="font-black text-white tracking-widest text-xl">
                FINANS<span className="text-[#2962ff]">PORTAL</span>
            </span>
        </Link>
    );
}