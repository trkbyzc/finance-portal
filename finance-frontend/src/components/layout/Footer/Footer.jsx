import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

/**
 * Site footer — Navbar ile aynı `max-w-container` hizasında.
 *
 * 3 link kolonu (Piyasalar / Araçlar / Kurumsal) + marka kolonu, altta yasal uyarı
 * (yatırım tavsiyesi değildir) ve veri kaynakları atıfı. Tüm metinler `footer` i18n
 * namespace'inden gelir; tema token'larıyla (bg-surface, border, text-muted) çalışır.
 */
const MARKET_LINKS = [
    { key: 'trStocks', to: '/markets/tr-stocks' },
    { key: 'usStocks', to: '/markets/us-stocks' },
    { key: 'crypto', to: '/markets/crypto' },
    { key: 'currencies', to: '/markets/currencies' },
    { key: 'commodities', to: '/markets/commodities' },
    { key: 'funds', to: '/markets/tr-funds' }
];

// auth: true olanlar yalnızca giriş yapmış kullanıcıya gösterilir (protected route'lar)
const TOOL_LINKS = [
    { key: 'interest', to: '/interest' },
    { key: 'portfolio', to: '/portfolio', auth: true },
    { key: 'watchlist', to: '/watchlist', auth: true },
    { key: 'simulation', to: '/simulation', auth: true },
    { key: 'economicCalendar', to: '/economic-calendar' },
    { key: 'news', to: '/news' }
];

const CORPORATE_LINKS = ['about', 'contact', 'privacy', 'terms'];

function FooterColumn({ title, children }) {
    return (
        <div>
            <h3 className="text-text font-bold text-sm uppercase tracking-wider mb-4">{title}</h3>
            <ul className="flex flex-col gap-2.5">{children}</ul>
        </div>
    );
}

export default function Footer() {
    const { t } = useTranslation(['footer']);
    const { isAuthenticated } = useAuth();
    const year = new Date().getFullYear();

    const linkClass = 'text-text-muted hover:text-primary text-sm transition-colors';

    const toolLinks = TOOL_LINKS.filter((link) => !link.auth || isAuthenticated);

    return (
        <footer className="bg-surface border-t border-border mt-16">
            <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 py-12">

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">

                    <div className="col-span-2 lg:col-span-1">
                        <Link to="/" className="flex items-center gap-0 group w-fit">
                            <img
                                src="/finanslogo.png"
                                alt="FinansPortal"
                                className="w-12 h-12 shrink-0 object-contain group-hover:opacity-90 transition-opacity"
                            />
                            <span className="font-black tracking-wider text-base text-text uppercase whitespace-nowrap -ml-4">
                                FINANS<span className="text-primary">PORTAL</span>
                            </span>
                        </Link>
                        <p className="text-text-muted text-sm mt-4 leading-relaxed max-w-xs">
                            {t('footer:description')}
                        </p>
                    </div>

                    <FooterColumn title={t('footer:columns.markets')}>
                        {MARKET_LINKS.map(({ key, to }) => (
                            <li key={key}>
                                <Link to={to} className={linkClass}>{t(`footer:links.${key}`)}</Link>
                            </li>
                        ))}
                    </FooterColumn>

                    <FooterColumn title={t('footer:columns.tools')}>
                        {toolLinks.map(({ key, to }) => (
                            <li key={key}>
                                <Link to={to} className={linkClass}>{t(`footer:links.${key}`)}</Link>
                            </li>
                        ))}
                    </FooterColumn>

                    <FooterColumn title={t('footer:columns.corporate')}>
                        {CORPORATE_LINKS.map((key) => (
                            <li key={key}>
                                <a href="#" className={linkClass}>{t(`footer:links.${key}`)}</a>
                            </li>
                        ))}
                    </FooterColumn>
                </div>

                <div className="mt-10 flex items-start gap-3 bg-surface-2 border border-border rounded-xl p-4">
                    <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
                    <p className="text-text-muted text-xs leading-relaxed">
                        {t('footer:disclaimer')}
                    </p>
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                    <p className="text-text-muted text-xs">{t('footer:copyright', { year })}</p>
                </div>
            </div>
        </footer>
    );
}
