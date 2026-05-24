import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import trCommon from './locales/tr/common.json';
import trNavbar from './locales/tr/navbar.json';
import trDashboard from './locales/tr/dashboard.json';
import trMarkets from './locales/tr/markets.json';
import trPortfolio from './locales/tr/portfolio.json';
import trAdmin from './locales/tr/admin.json';
import trAuth from './locales/tr/auth.json';
import trProfile from './locales/tr/profile.json';
import trAsset from './locales/tr/asset.json';
import trNews from './locales/tr/news.json';
import trInterest from './locales/tr/interest.json';
import trCharts from './locales/tr/charts.json';
import trErrors from './locales/tr/errors.json';

import enCommon from './locales/en/common.json';
import enNavbar from './locales/en/navbar.json';
import enDashboard from './locales/en/dashboard.json';
import enMarkets from './locales/en/markets.json';
import enPortfolio from './locales/en/portfolio.json';
import enAdmin from './locales/en/admin.json';
import enAuth from './locales/en/auth.json';
import enProfile from './locales/en/profile.json';
import enAsset from './locales/en/asset.json';
import enNews from './locales/en/news.json';
import enInterest from './locales/en/interest.json';
import enCharts from './locales/en/charts.json';
import enErrors from './locales/en/errors.json';

const STORAGE_KEY = 'finansportal-language';

const getStoredLanguage = () => {
    if (typeof window === 'undefined') return 'tr';
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored === 'en' || stored === 'tr' ? stored : 'tr';
    } catch {
        return 'tr';
    }
};

i18n
    .use(initReactI18next)
    .init({
        lng: getStoredLanguage(),
        fallbackLng: 'tr',
        defaultNS: 'common',
        ns: [
            'common', 'navbar', 'dashboard', 'markets', 'portfolio',
            'admin', 'auth', 'profile', 'asset', 'news', 'interest',
            'charts', 'errors'
        ],
        resources: {
            tr: {
                common: trCommon,
                navbar: trNavbar,
                dashboard: trDashboard,
                markets: trMarkets,
                portfolio: trPortfolio,
                admin: trAdmin,
                auth: trAuth,
                profile: trProfile,
                asset: trAsset,
                news: trNews,
                interest: trInterest,
                charts: trCharts,
                errors: trErrors
            },
            en: {
                common: enCommon,
                navbar: enNavbar,
                dashboard: enDashboard,
                markets: enMarkets,
                portfolio: enPortfolio,
                admin: enAdmin,
                auth: enAuth,
                profile: enProfile,
                asset: enAsset,
                news: enNews,
                interest: enInterest,
                charts: enCharts,
                errors: enErrors
            }
        },
        interpolation: {
            escapeValue: false
        },
        returnNull: false
    });

i18n.on('languageChanged', (lng) => {
    try {
        localStorage.setItem(STORAGE_KEY, lng);
        document.documentElement.setAttribute('lang', lng);
    } catch {}
});

document.documentElement.setAttribute('lang', i18n.language);

export default i18n;
