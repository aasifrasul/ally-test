import { createContext, ReactNode } from 'react';

import { useToggle } from '../hooks/useToggle';

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
	const [state, toggleTheme] = useToggle(true);

	const value = {
		theme: state ? 'light' : 'dark',
		toggleTheme,
		isDark: !state,
	};

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
