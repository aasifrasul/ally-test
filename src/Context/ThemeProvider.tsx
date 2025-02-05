import { createContext, ReactNode, useState } from 'react';

export interface ThemeContextType {
	theme: string;
	toggleTheme: () => void;
	isDark: boolean;
}

interface ThemeProviderProps {
	children: ReactNode;
}

export const ThemeContext = createContext<ThemeContextType>({
	theme: 'light',
	toggleTheme: () => {},
	isDark: false,
});

export const ThemeProvider = ({ children }: ThemeProviderProps): ReactNode => {
	const [theme, setTheme] = useState('light');

	const toggleTheme = (): void => {
		setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
	};

	const value = {
		theme,
		toggleTheme,
		isDark: theme === 'dark',
	};

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
