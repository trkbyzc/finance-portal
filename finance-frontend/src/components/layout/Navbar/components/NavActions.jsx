import React from 'react';
import { Link } from 'react-router-dom';

export default function NavActions() {
    return (
        <div className="flex items-center gap-4 shrink-0">
            <Link to="/markets/live" className="hidden lg:flex items-center gap-2 bg-[#f23645]/10 text-[#f23645] px-3 py-1.5 rounded-md border border-[#f23645]/20 hover:bg-[#f23645]/20 transition-colors mr-2">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f23645] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#f23645]"></span>
                </span>
                <span className="text-sm font-bold tracking-wider animate-pulse">CANLI PİYASA</span>
            </Link>
        </div>
    );
}
