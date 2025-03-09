import React, { createContext, useState } from 'react';

interface LocaleContextType {
	locale: string;
	translations: Record<string, string>;
	changeLocale: (newLocale: string) => void;
}

const LocaleContext = createContext<LocaleContextType>({
	locale: '',
	translations: { abc: 'xyz' },
	changeLocale: (newLocale) => {},
});

export const LocaleContextProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
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
