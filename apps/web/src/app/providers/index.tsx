import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { setAuthToken } from '@/shared/api';
import { I18nProvider } from '@/shared/lib/i18n';
import { StorageProvider } from '@/shared/lib/storage';
import { ThemeProvider } from '@/shared/lib/theme';

// Initialize axios token on app start
const token = localStorage.getItem('auth_token');
if (token) setAuthToken(token);

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { staleTime: 1000 * 60, retry: 1 },
	},
});

export function Providers({ children }: { children: ReactNode }) {
	return (
		<I18nProvider>
			<ThemeProvider>
				<QueryClientProvider client={queryClient}>
					<StorageProvider>{children}</StorageProvider>
					<Toaster position='bottom-right' richColors />
				</QueryClientProvider>
			</ThemeProvider>
		</I18nProvider>
	);
}
