import { createContext, useContext } from 'react';
import { useCsrfToken } from '../hooks/useCsrfToken';

const SecurityContext = createContext<{ csrfToken: string }>({ csrfToken: '' });

export function SecurityProvider({ children }: { children: React.ReactNode }) {
	const csrfToken = useCsrfToken();

	return (
		<SecurityContext.Provider value={{ csrfToken }}>{children}</SecurityContext.Provider>
	);
}

export function useSecurityContext() {
	const context = useContext(SecurityContext);
	if (!context) {
		throw new Error('useSecurityContext must be used within a SecurityProvider');
	}
	return context;
}
