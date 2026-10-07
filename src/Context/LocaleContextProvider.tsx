import React, { createContext, useMemo, useState } from 'react';

import { createContextProvider } from './contextProviderFactory';

export interface LocaleContextType {
	locale: string;
	translations: Record<string, string>;
	changeLocale: (newLocale: string) => void;
}

export const LocaleContext = createContext<LocaleContextType>({
	locale: '',
	translations: { abc: 'xyz' },
	changeLocale: () => {},
});

export function createLocaleContext(): [
	React.FC<{ children?: React.ReactNode; value: LocaleContextType }>,
	() => LocaleContextType,
] {
	return createContextProvider(LocaleContext, 'LocaleProvider');
}

export const [LocaleContextProvider, useLocaleContextValue] = createLocaleContext();

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [locale, setLocale] = useState('en');
	const [translations] = useState<Record<string, string>>({});

	const changeLocale = (newLocale: string) => {
		setLocale(newLocale);
	};

	const value = useMemo(
		() => ({ locale, translations, changeLocale }),
		[locale, translations],
	);

	return <LocaleContextProvider value={value}>{children}</LocaleContextProvider>;
};

export const useLocaleContext = () => {
	const context = useLocaleContextValue();
	if (!context) {
		throw new Error('useLocaleContext must be used within a LocaleProvider');
	}
	return context;
};
