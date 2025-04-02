import React from 'react';

import { useToggle } from '../hooks/useToggle';

export interface ThemeContextType {
	theme: string;
	toggleTheme: () => void;
	isDark: boolean;
}

export const ThemeContext = React.createContext<ThemeContextType>({
	theme: 'light',
	toggleTheme: () => {},
	isDark: false,
});

export const ThemeProvider = (props: { children: React.ReactNode }) => {
	const [state, toggleTheme] = useToggle(true);

	const value = {
		theme: state ? 'light' : 'dark',
		toggleTheme,
		isDark: !state,
	};

	return <ThemeContext.Provider value={value}>{props.children}</ThemeContext.Provider>;
};
