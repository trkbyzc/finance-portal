import { useQuery } from '@tanstack/react-query';
import { preferencesApi } from '../services/api/preferencesApi';
import { useAuth } from '../context/AuthContext';

/**
 * Auth user için preferences çeker. Guest user için null döner (sorgu disabled).
 * MarketTicker, App-level TickerGate, PreferencesPage hepsi bunu kullanır — tek source of truth.
 *
 * Cache 60s. PUT mutation çalıştığında invalidate edilmeli ki ticker anında yenilensin.
 */
export default function useUserPreferences() {
    const { isAuthenticated } = useAuth();

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['user-preferences'],
        queryFn: preferencesApi.getMyPreferences,
        enabled: isAuthenticated,
        staleTime: 60_000
    });

    return {
        preferences: data,
        isLoading: isAuthenticated && isLoading,
        refetch
    };
}
