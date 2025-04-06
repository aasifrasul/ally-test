import { createContext, ReactNode } from 'react';

import { useToggle } from '../hooks/useToggle';

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

export const ThemeProvider = (props: { children: ReactNode }) => {
	const [state, toggleTheme] = useToggle(true);

	const value = {
		theme: state ? 'light' : 'dark',
		toggleTheme,
		isDark: !state,
	};

	return <ThemeContext.Provider value={value}>{props.children}</ThemeContext.Provider>;
};
