import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Providers } from './app/providers';
import { HomePage } from './pages/home/ui/HomePage';
import '@bookmark/ui/styles/globals.css';
import './index.css';

createRoot(document.getElementById('root') as HTMLElement).render(
	<StrictMode>
		<Providers>
			<HomePage />
		</Providers>
	</StrictMode>,
);
