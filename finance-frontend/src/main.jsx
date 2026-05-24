import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './i18n';
import './index.css';

// React Query İstemcisini oluşturuyoruz
// refetchOnWindowFocus: false diyerek, kullanıcı her sekmeye döndüğünde API'ye gereksiz istek atmasını engelliyoruz
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1, // Hata olursa sadece 1 kez tekrar dener
            staleTime: 60 * 1000, // Veriler 60 saniye boyunca taze kabul edilir, 1 dakika dolmadan arka planda istek atılmaz (Performans artışı)
        },
    },
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </ThemeProvider>
    </React.StrictMode>
);