import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { CurrencyProvider } from './context/CurrencyContext';
import { AuthProvider } from './context/AuthContext';

// Component ve Sayfa Importları
import Navbar from './components/layout/Navbar/Navbar.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import MarketPage from './pages/MarketPage/MarketPage.jsx';
import NewsPage from './pages/NewsPage/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage/NewsDetailPage';
import LiveMarketPage from './pages/LiveMarketPage/LiveMarketPage';
import InterestPage from './pages/InterestPage/InterestPage.jsx';
import AssetDetailPage from './pages/AssetDetailPage/AssetDetailPage';
import MarketListPage from "./pages/MarketListPage/MarketListPage.jsx";
import BankCurrenciesPage from './pages/BankCurrenciesPage/BankCurrenciesPage.jsx';
import TurkishGoldPage from './pages/TurkishGoldPage/TurkishGoldPage.jsx';

// Auth Sayfaları (Sadece Callback)
import AuthCallbackPage from "./pages/AuthPage/AuthCallbackPage.jsx";
import CallbackPage from './pages/CallbackPage/CallbackPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import PortfolioPage from './pages/PortfolioPage/PortfolioPage';
import WatchlistPage from './pages/WatchlistPage/WatchlistPage';
import SimulationPage from './pages/SimulationPage/SimulationPage';
import WhatIfPage from './pages/WhatIfPage/WhatIfPage';
import EconomicCalendarPage from './pages/EconomicCalendarPage/EconomicCalendarPage';
import PreferencesPage from './pages/PreferencesPage/PreferencesPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPage from './pages/AdminPage/AdminPage.jsx';
import GlobalTicker from './components/layout/MarketTicker/GlobalTicker';



function App() {
    return (
        <AuthProvider>
            <CurrencyProvider>
                <Router>
                    <div className="min-h-screen bg-bg text-text font-sans selection:bg-primary selection:text-primary-fg">
                        <Navbar />
                        <GlobalTicker />
                        <main>
                            <Routes>
                                {/* Public Routes */}
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/markets/:category" element={<MarketPage />} />
                                <Route path="/markets/:category/list" element={<MarketListPage />} />
                                <Route path="/chart/:symbol" element={<AssetDetailPage />} />
                                <Route path="/markets/bank-currencies" element={<BankCurrenciesPage />} />
                                <Route path="/markets/turkish-gold" element={<TurkishGoldPage />} />
                                <Route path="/news" element={<NewsPage />} />
                                <Route path="/news/detail" element={<NewsDetailPage />} />
                                <Route path="/economic-calendar" element={<EconomicCalendarPage />} />
                                <Route path="/markets/live" element={<LiveMarketPage />} />
                                <Route path="/interest" element={<InterestPage />} />

                                {/* Auth Callback (Keycloak'tan dönüş) */}
                                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                                <Route path="/callback" element={<CallbackPage />} />

                                {/* Protected Routes */}
                                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                                <Route path="/portfolio" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
                                <Route path="/watchlist" element={<ProtectedRoute><WatchlistPage /></ProtectedRoute>} />
                                <Route path="/simulation" element={<ProtectedRoute><SimulationPage /></ProtectedRoute>} />
                                <Route path="/what-if" element={<ProtectedRoute><WhatIfPage /></ProtectedRoute>} />
                                <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                                <Route path="/preferences" element={<ProtectedRoute><PreferencesPage /></ProtectedRoute>} />
                            </Routes>
                        </main>
                    </div>
                </Router>
            </CurrencyProvider>
        </AuthProvider>
    );
}

export default App;
