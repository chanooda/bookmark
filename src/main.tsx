import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './shared/i18n';
import { QueryProvider } from './app/query-provider';
import { ThemeProvider } from './shared/libs/theme';

createRoot(document.getElementById('root')!).render(
	<ThemeProvider>
		<QueryProvider>
			<App />
		</QueryProvider>
	</ThemeProvider>,
);
