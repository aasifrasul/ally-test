import { createContext, useState } from 'react';

interface AuthProviderProps {
	children: React.ReactNode;
}

interface AuthContextType {
	user: any;
	login: (credentials: any) => void;
	logout: () => void;
	isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
	user: {},
	login: (credentials) => {},
	logout: () => {},
	isLoading: false,
});

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const [user, setUser] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	const login = async (credentials: any) => {
		/* ... */
	};
	const logout = async () => {
		/* ... */
	};

	return (
		<AuthContext.Provider value={{ user, login, logout, isLoading }}>
			{children}
		</AuthContext.Provider>
	);
};
