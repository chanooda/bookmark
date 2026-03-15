import { setAuthToken } from '@repo/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { StorageProvider } from '@/shared/lib/storage';

const token = localStorage.getItem('auth_token');
if (token) setAuthToken(token);

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { staleTime: 1000 * 60, retry: 1 },
	},
});

export function Providers({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<StorageProvider>{children}</StorageProvider>
			<Toaster position='bottom-center' richColors />
		</QueryClientProvider>
	);
}
