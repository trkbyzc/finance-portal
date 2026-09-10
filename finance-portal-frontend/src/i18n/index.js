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
import trWatchlist from './locales/tr/watchlist.json';
import trSimulation from './locales/tr/simulation.json';
import trWhatIf from './locales/tr/whatIf.json';
import trEconomicCalendar from './locales/tr/economicCalendar.json';
import trPreferences from './locales/tr/preferences.json';
import trAlarm from './locales/tr/alarm.json';
import trFooter from './locales/tr/footer.json';
import trChat from './locales/tr/chat.json';

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
import enWatchlist from './locales/en/watchlist.json';
import enSimulation from './locales/en/simulation.json';
import enWhatIf from './locales/en/whatIf.json';
import enEconomicCalendar from './locales/en/economicCalendar.json';
import enPreferences from './locales/en/preferences.json';
import enAlarm from './locales/en/alarm.json';
import enFooter from './locales/en/footer.json';
import enChat from './locales/en/chat.json';

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
            'charts', 'errors', 'watchlist', 'simulation', 'whatIf',
            'economicCalendar', 'preferences', 'alarm', 'footer', 'chat'
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
                errors: trErrors,
                watchlist: trWatchlist,
                simulation: trSimulation,
                whatIf: trWhatIf,
                economicCalendar: trEconomicCalendar,
                preferences: trPreferences,
                alarm: trAlarm,
                footer: trFooter,
                chat: trChat
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
                errors: enErrors,
                watchlist: enWatchlist,
                simulation: enSimulation,
                whatIf: enWhatIf,
                economicCalendar: enEconomicCalendar,
                preferences: enPreferences,
                alarm: enAlarm,
                footer: enFooter,
                chat: enChat
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
    } catch {
        // localStorage erişilemiyorsa (private mode vs.) sessiz geç
    }
});

document.documentElement.setAttribute('lang', i18n.language);

export default i18n;
