import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Navbar logo — finanslogo.png (public/'dan) + FINANSPORTAL wordmark.
 *
 * PNG `public/finanslogo.png` Vite static asset; build sırasında değiştirilmez,
 * `/finanslogo.png` yolundan servis edilir. Boyut responsive: navbar 64px yüksekliğinde
 * olduğundan logo 28→32→36 px arası, çevre padding ile iç içe geçmesin.
 */
export default function NavLogo() {
    return (
        <Link to="/" className="flex items-center gap-2 min-w-0 shrink group">
            <img
                src="/finanslogo.png"
                alt="FinansPortal"
                className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 shrink-0 object-contain group-hover:opacity-90 transition-opacity"
            />
            <span className="font-black tracking-normal sm:tracking-wider md:tracking-widest text-[13px] sm:text-base md:text-lg text-nav-text uppercase whitespace-nowrap">
                FINANS<span className="text-primary group-hover:opacity-80 transition-opacity">PORTAL</span>
            </span>
        </Link>
    );
}
