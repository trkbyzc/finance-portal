import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import NavLogo from './components/NavLogo';
import NavDropdown from './components/NavDropdown';
import NavActions from './components/NavActions';
import MobileMenu from './components/MobileMenu';
import ThemeToggle from '../ThemeToggle';
import LanguageToggle from '../LanguageToggle';
import UserDrawer from '../UserDrawer';
import Avatar from '../../profile/Avatar';
import useProfileAvatar from '../../../hooks/useProfileAvatar';
import { useAuth } from '../../../context/AuthContext';

export default function Navbar() {
    const { isAuthenticated, user } = useAuth();
    const { t } = useTranslation(['navbar', 'common']);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const avatarId = useProfileAvatar();

    const navConfig = [
        { title: t('navbar:categories.stocks'), items: [
                { label: t('navbar:items.trStocks'), to: '/markets/tr-stocks' },
                { label: t('navbar:items.usStocks'), to: '/markets/us-stocks' },
                { type: 'divider' },
                { label: t('navbar:items.viop'), to: '/markets/viop', desc: t('navbar:items.viopDesc') },
                { label: t('navbar:items.globalFutures'), to: '/markets/futures', desc: t('navbar:items.globalFuturesDesc'), accent: '#3b82f6' }
            ]},
        { title: t('navbar:categories.currencies'), items: [
                { label: t('navbar:items.tcmbRates'), to: '/markets/currencies', desc: t('navbar:items.tcmbDesc') },
                { label: t('navbar:items.effectiveRates'), to: '/markets/effective-currencies', desc: t('navbar:items.effectiveDesc'), accent: '#f59e0b' },
                { type: 'divider' },
                { label: t('navbar:items.bankRates'), to: '/markets/bank-currencies', desc: t('navbar:items.bankRatesDesc'), accent: '#00a572' }
            ]},
        { title: t('navbar:categories.crypto'), items: [
                { label: t('navbar:items.cryptoMarket'), to: '/markets/crypto', desc: t('navbar:items.cryptoMarketDesc'), accent: '#f7931a' }
            ]},
        { title: t('navbar:categories.commodities'), items: [
                { label: t('navbar:items.turkishGold'), to: '/markets/turkish-gold', desc: t('navbar:items.turkishGoldDesc'), accent: '#f59e0b' },
                { type: 'divider' },
                { label: t('navbar:items.preciousMetals'), to: '/markets/commodities', desc: t('navbar:items.preciousMetalsDesc') }
            ]},
        { title: t('navbar:categories.fixedIncome'), items: [
                { label: t('navbar:items.depositSim'), to: '/interest', accent: '#00a572' },
                { type: 'divider' },
                { label: t('navbar:items.trBonds'), to: '/chart/TP.TRT070335K16?cat=TR_BOND', desc: t('navbar:items.trBondsDesc') },
                { label: t('navbar:items.globalBonds'), to: '/markets/bonds', desc: t('navbar:items.globalBondsDesc') },
                { label: t('navbar:items.eurobonds'), to: '/markets/eurobonds', desc: t('navbar:items.eurobondsDesc'), accent: '#f59e0b' }
            ]},
        { title: t('navbar:categories.funds'), items: [
                { label: t('navbar:items.trFunds'), to: '/markets/tr-funds', desc: t('navbar:items.trFundsDesc') },
                { type: 'divider' },
                { label: t('navbar:items.globalFunds'), to: '/markets/global-funds', desc: t('navbar:items.globalFundsDesc') }
            ]}
    ];

    const initials = (user?.preferred_username || user?.username || user?.given_name || user?.name || '?');

    return (
        <>
            <nav
                className="h-16 sticky top-0 z-50 backdrop-blur-xl border-b"
                style={{
                    backgroundColor: 'var(--nav-bg)',
                    borderColor: 'var(--nav-border)'
                }}
            >
                <div className="h-full max-w-container mx-auto px-3 sm:px-4 md:px-6 flex items-center justify-between gap-2 md:gap-6">

                    {/* SOL: Logo + nav links */}
                    <div className="flex items-center gap-3 md:gap-8 min-w-0">
                        {/* Hamburger — sadece mobile/tablet */}
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            className="md:hidden p-2 -ml-2 rounded-lg text-nav-text/80 hover:text-nav-text hover:bg-nav-text/10 transition"
                            aria-label={t('navbar:openMenu', 'Menüyü aç')}
                        >
                            <Menu size={22} />
                        </button>

                        <NavLogo />

                        <div className="hidden md:flex items-center gap-1">
                            {navConfig.map((nav, idx) => (
                                <NavDropdown key={idx} title={nav.title} items={nav.items} />
                            ))}

                            <Link
                                to="/news"
                                className="px-3 py-2 text-[12px] font-bold uppercase tracking-wider text-nav-text/70 hover:text-nav-text transition-colors"
                            >
                                {t('navbar:news')}
                            </Link>
                            <Link
                                to="/economic-calendar"
                                className="px-3 py-2 text-[12px] font-bold uppercase tracking-wider text-nav-text/70 hover:text-nav-text transition-colors"
                            >
                                {t('navbar:economicCalendar')}
                            </Link>
                        </div>
                    </div>

                    {/* SAĞ: Live + Theme + Lang + User */}
                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                        <div className="hidden sm:block">
                            <NavActions />
                        </div>
                        <LanguageToggle compact />
                        <ThemeToggle compact />

                        <div className="hidden sm:block h-6 w-px bg-nav-border" />

                        {isAuthenticated ? (
                            <button
                                onClick={() => setDrawerOpen(true)}
                                className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full hover:bg-nav-text/10 transition-colors group"
                                title={t('navbar:userPanel')}
                                aria-label={t('navbar:userPanelAria')}
                            >
                                <Avatar id={avatarId} fallbackInitials={initials} size={32} />
                                <span className="hidden lg:inline text-sm font-semibold text-nav-text max-w-30 truncate">
                                    {user?.preferred_username || t('navbar:accountMenu')}
                                </span>
                                <Menu size={16} className="hidden sm:block text-nav-text/60 group-hover:text-nav-text transition-colors" />
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        window.location.href = 'http://localhost:8080/realms/finance-realm/protocol/openid-connect/registrations?' +
                                            'client_id=finance-client&' +
                                            'redirect_uri=http://localhost:5173/auth/callback&' +
                                            'response_type=code&' +
                                            'scope=openid';
                                    }}
                                    className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-bold rounded-lg border border-nav-border text-nav-text hover:bg-nav-text/10 transition-all"
                                >
                                    {t('navbar:register')}
                                </button>
                                <button
                                    onClick={() => {
                                        window.location.href = 'http://localhost:8080/realms/finance-realm/protocol/openid-connect/auth?' +
                                            'client_id=finance-client&' +
                                            'redirect_uri=http://localhost:5173/auth/callback&' +
                                            'response_type=code&' +
                                            'scope=openid';
                                    }}
                                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-primary hover:bg-primary-hover text-primary-fg shadow-sm shadow-primary/30 transition-all"
                                >
                                    {t('navbar:login')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {isAuthenticated && (
                <UserDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
            )}

            <MobileMenu
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                navConfig={navConfig}
                extraLinks={[
                    { to: '/news', label: t('navbar:news') },
                    { to: '/economic-calendar', label: t('navbar:economicCalendar') }
                ]}
            />
        </>
    );
}
