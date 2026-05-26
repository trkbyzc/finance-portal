import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import NavLogo from './components/NavLogo';
import NavDropdown from './components/NavDropdown';
import NavActions from './components/NavActions';
import ThemeToggle from '../ThemeToggle';
import LanguageToggle from '../LanguageToggle';
import UserDrawer from '../UserDrawer';
import { useAuth } from '../../../context/AuthContext';

export default function Navbar() {
    const { isAuthenticated, user } = useAuth();
    const { t } = useTranslation(['navbar', 'common']);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const navConfig = [
        { title: t('navbar:categories.stocks'), items: [
                { label: t('navbar:items.trStocks'), to: '/markets/tr-stocks' },
                { label: t('navbar:items.usStocks'), to: '/markets/us-stocks' },
                { type: 'divider' },
                { label: t('navbar:items.viop'), to: '/markets/viop' }
            ]},
        { title: t('navbar:categories.currencies'), items: [
                { label: t('navbar:items.tcmbRates'), to: '/markets/currencies', desc: t('navbar:items.tcmbDesc') },
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

    const initials = (user?.preferred_username || user?.given_name || '?').charAt(0).toUpperCase();

    return (
        <>
            <nav
                className="h-16 sticky top-0 z-50 backdrop-blur-xl border-b"
                style={{
                    backgroundColor: 'var(--nav-bg)',
                    borderColor: 'var(--nav-border)'
                }}
            >
                <div className="h-full max-w-container mx-auto px-6 flex items-center justify-between gap-6">

                    {/* SOL: Logo + nav links */}
                    <div className="flex items-center gap-8">
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
                        </div>
                    </div>

                    {/* SAĞ: Live + Theme + Lang + User */}
                    <div className="flex items-center gap-3">
                        <NavActions />
                        <LanguageToggle compact />
                        <ThemeToggle compact />

                        <div className="h-6 w-px bg-nav-border" />

                        {isAuthenticated ? (
                            <button
                                onClick={() => setDrawerOpen(true)}
                                className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full hover:bg-nav-text/10 transition-colors group"
                                title={t('navbar:userPanel')}
                                aria-label={t('navbar:userPanelAria')}
                            >
                                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-xs font-black uppercase">
                                    {initials}
                                </div>
                                <span className="hidden md:inline text-sm font-semibold text-nav-text max-w-30 truncate">
                                    {user?.preferred_username || t('navbar:accountMenu')}
                                </span>
                                <Menu size={16} className="text-nav-text/60 group-hover:text-nav-text transition-colors" />
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
                                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-nav-border text-nav-text hover:bg-nav-text/10 transition-all"
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
        </>
    );
}
