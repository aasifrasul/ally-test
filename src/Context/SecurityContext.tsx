import { createContext, useContext, ReactNode, useMemo } from 'react';

import { createContextProvider } from './contextProviderFactory';
import { useCsrfToken } from '../hooks/useCsrfToken';

export const SecurityContext = createContext<{ csrfToken: string }>({ csrfToken: '' });

export function createSecurityContext(): [
	React.FC<{ children?: ReactNode; value: { csrfToken: string } }>,
	() => { csrfToken: string },
] {
	return createContextProvider(SecurityContext, 'SecurityProvider');
}

export const [SecurityContextProvider, useSecurityContextValue] = createSecurityContext();

export function SecurityProvider({ children }: { children: React.ReactNode }) {
	const csrfToken = useCsrfToken();
	const value = useMemo(() => ({ csrfToken }), [csrfToken]);

	return <SecurityContextProvider value={value}>{children}</SecurityContextProvider>;
}

export function useSecurityContext() {
	const context = useContext(SecurityContext);
	if (!context) {
		throw new Error('useSecurityContext must be used within a SecurityProvider');
	}
	return context;
}

export const useSecurityContextInstance = useSecurityContext;
