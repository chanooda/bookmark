import type { ChildrenProps } from '@chanooda/libs-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface QueryProviderProps extends ChildrenProps {}

export const QueryProvider = ({ children }: QueryProviderProps) => {
	const queryClient = new QueryClient();

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
