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
        <Link to="/" className="flex items-center gap-0 min-w-0 shrink-0 group">
            <img
                src="/finanslogo.png"
                alt="FinansPortal"
                className="w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 shrink-0 object-contain group-hover:opacity-90 transition-opacity"
            />
            {/* -ml-2: logo PNG'nin transparan padding'i text'le visual gap yaratıyor;
                negative margin ile F harfi wordmark'a tam yapışsın. */}
            <span className="font-black tracking-tight sm:tracking-normal md:tracking-wider text-sm sm:text-base text-nav-text uppercase whitespace-nowrap -ml-2">
                FINANS<span className="text-primary group-hover:opacity-80 transition-opacity">PORTAL</span>
            </span>
        </Link>
    );
}
