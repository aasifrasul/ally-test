import React, { createContext, useState } from 'react';

interface LocaleContextType {
	locale: string;
	translations: Record<string, string>;
	changeLocale: (newLocale: string) => void;
}

interface LocaleContextProviderProps {
	children: React.ReactNode;
}

const LocaleContext = createContext<LocaleContextType>({
	locale: '',
	translations: { abc: 'xyz' },
	changeLocale: (newLocale) => {},
});

export const LocaleContextProvider = ({ children }: LocaleContextProviderProps) => {
	const [locale, setLocale] = useState('en');
	const [translations, setTranslations] = useState({});

	const changeLocale = async (newLocale: string) => {
		setLocale(newLocale);
	};

	return (
		<LocaleContext.Provider value={{ locale, translations, changeLocale }}>
			{children}
		</LocaleContext.Provider>
	);
};
