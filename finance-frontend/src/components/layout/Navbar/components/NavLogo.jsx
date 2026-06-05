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
                className="w-10 h-10 sm:w-13 sm:h-13 md:w-17 md:h-17 shrink-0 object-contain group-hover:opacity-90 transition-opacity"
            />
            {/* Wordmark < 480px'de gizli — Mobile S/Medium ekranlarda diğer kontroller
                (TR/EN + tema + avatar) sığsın diye. ≥ 480px'den itibaren görünür.
                -ml-2/-5: PNG transparan padding'ini text'e bitiştir. */}
            <span className="hidden min-[480px]:inline font-black tracking-tight sm:tracking-normal md:tracking-wider text-sm sm:text-base text-nav-text uppercase whitespace-nowrap -ml-2 sm:-ml-5">
                FINANS<span className="text-primary group-hover:opacity-80 transition-opacity">PORTAL</span>
            </span>
        </Link>
    );
}
