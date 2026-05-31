import type { ChildrenProps } from '@chanooda/libs-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OverlayProvider } from 'overlay-kit';

interface QueryProviderProps extends ChildrenProps {}

const queryClient = new QueryClient();

export const QueryProvider = ({ children }: QueryProviderProps) => {
	return (
		<QueryClientProvider client={queryClient}>
			<OverlayProvider>{children}</OverlayProvider>
		</QueryClientProvider>
	);
};
