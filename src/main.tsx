import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { QueryProvider } from './app/query-provider';

createRoot(document.getElementById('root')!).render(
	<QueryProvider>
		<App />
	</QueryProvider>,
);
