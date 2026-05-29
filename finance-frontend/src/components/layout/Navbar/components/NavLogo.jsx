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
        <Link to="/" className="flex items-center gap-1 min-w-0 shrink-0 group">
            <img
                src="/finanslogo.png"
                alt="FinansPortal"
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 shrink-0 object-contain group-hover:opacity-90 transition-opacity"
            />
            {/* tracking-widest çıkarıldı: FINANSPORTAL md+ ekranlarda dropdown'larla
                çakışıyordu. tracking-wider yeterli, text-base yeterince okunaklı. */}
            <span className="font-black tracking-tight sm:tracking-normal md:tracking-wider text-sm sm:text-base text-nav-text uppercase whitespace-nowrap">
                FINANS<span className="text-primary group-hover:opacity-80 transition-opacity">PORTAL</span>
            </span>
        </Link>
    );
}
