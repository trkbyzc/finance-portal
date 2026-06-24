import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './i18n';
import './index.css';

// refetchOnWindowFocus kapalı: sekme değiştirme olayında gereksiz API isteği atılmasını engeller
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 60 * 1000, // 60 sn boyunca taze kabul edilir; süre dolmadan arka planda yeniden istek atılmaz
        },
    },
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </ThemeProvider>
    </StrictMode>
);