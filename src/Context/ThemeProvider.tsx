import { createContext, ReactNode, useMemo } from 'react';

import { createContextProvider } from './contextProviderFactory';
import { useToggle } from '../hooks';

export interface ThemeContextType {
	theme: string;
	toggleTheme: () => void;
	isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextType>({
	theme: 'light',
	toggleTheme: () => {},
	isDark: false,
});

export function createThemeContext(): [
	React.FC<{ children?: ReactNode; value: ThemeContextType }>,
	() => ThemeContextType,
] {
	return createContextProvider(ThemeContext, 'ThemeProvider');
}

export const [ThemeContextProvider, useThemeContext] = createThemeContext();

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
	const [state, toggleTheme] = useToggle(true);

	const value = useMemo(
		() => ({
			theme: state ? 'light' : 'dark',
			toggleTheme,
			isDark: !state,
		}),
		[state, toggleTheme],
	);

	return <ThemeContextProvider value={value}>{children}</ThemeContextProvider>;
};

export const useTheme = () => {
	const context = useThemeContext();
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
};
