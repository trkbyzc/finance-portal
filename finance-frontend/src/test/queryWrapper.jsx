import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

/**
 * Test wrapper — useQuery'li hook'lar ve Router gerektiren component'ler için.
 *
 * Kullanım:
 *   import { wrapperWithQuery } from '../../test/queryWrapper';
 *   renderHook(() => useMyHook(), { wrapper: wrapperWithQuery() });
 */
export function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, staleTime: Infinity, gcTime: 0 },
            mutations: { retry: false },
        },
    });
}

export function wrapperWithQuery() {
    const client = makeQueryClient();
    return function Wrapper({ children }) {
        return (
            <QueryClientProvider client={client}>
                <MemoryRouter>{children}</MemoryRouter>
            </QueryClientProvider>
        );
    };
}
