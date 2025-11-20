import { createContext, FC, ReactNode, useState, useContext } from 'react';

import { fetchAPIData } from '../utils/AsyncUtil';
import { HTTPMethod } from '../types/api';
import { IUser } from '../../server/src/types';

interface LoginCredentials {
	email: string;
	password: string;
}

interface LoginResponse {
	success: boolean;
	authToken?: string;
	user?: IUser;
}

interface AuthContextType {
	user: IUser | null;
	login: (credentials: LoginCredentials) => Promise<boolean>;
	logout: () => Promise<boolean>;
	isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<IUser | null>(null);
	const [token, setToken] = useState<string>('');
	const [isLoading, setIsLoading] = useState(true);

	const login = async (credentials: LoginCredentials) => {
		setIsLoading(true);
		const result = await fetchAPIData<LoginResponse>(`/auth/login`, {
			method: HTTPMethod.POST,
			body: JSON.stringify(credentials),
		});
		setIsLoading(false);

		if (
			result.success &&
			result.data.success &&
			result.data.authToken &&
			result.data.user
		) {
			setToken(result.data.authToken);
			setUser(result.data.user);
			return true;
		}

		// Clear any stale auth state on login failure
		setToken('');
		setUser(null);
		return false;
	};

	const logout = async () => {
		setIsLoading(true);
		const result = await fetchAPIData(`/auth/logout`, {
			method: HTTPMethod.POST,
			headers: {
				authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ token }),
		});
		setIsLoading(false);

		// Clear local state regardless (optimistic logout)
		// The server invalidated the token or will eventually
		setToken('');
		setUser(null);

		// But still return whether the API call succeeded
		return result.success && (result.data as any)?.success;
	};

	return (
		<AuthContext.Provider value={{ user, login, logout, isLoading }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
