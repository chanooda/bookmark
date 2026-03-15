import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
	theme: Theme;
	resolvedTheme: 'light' | 'dark';
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'theme';

function getSystemTheme(): 'light' | 'dark' {
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
	if (theme === 'system') return getSystemTheme();
	return theme;
}

function applyTheme(resolved: 'light' | 'dark') {
	const root = document.documentElement;
	if (resolved === 'dark') {
		root.classList.add('dark');
	} else {
		root.classList.remove('dark');
	}
}

function loadStoredTheme(): Theme {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
	} catch {
		// ignore
	}
	return 'system';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(loadStoredTheme);

	const resolvedTheme = resolveTheme(theme);

	useEffect(() => {
		applyTheme(resolvedTheme);
	}, [resolvedTheme]);

	// Listen for system preference changes when theme === 'system'
	useEffect(() => {
		if (theme !== 'system') return;
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const handler = () => applyTheme(getSystemTheme());
		media.addEventListener('change', handler);
		return () => media.removeEventListener('change', handler);
	}, [theme]);

	function setTheme(next: Theme) {
		setThemeState(next);
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {
			// ignore
		}
	}

	return (
		<ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme(): ThemeContextValue {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
	return ctx;
}
