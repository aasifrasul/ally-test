import { useCallback } from 'react';

import { useApi } from './useApi';

export function useAuth() {
	const { execute, ...state } = useApi<{ token: string }>();

	const login = useCallback(
		async (credentials: { username: string; password: string }) => {
			return execute('/login', {
				method: 'POST',
				body: JSON.stringify(credentials),
			});
		},
		[execute],
	);

	const register = useCallback(
		async (userData: { username: string; password: string; email: string }) => {
			return execute('/register', {
				method: 'POST',
				body: JSON.stringify(userData),
			});
		},
		[execute],
	);

	return {
		...state,
		login,
		register,
	};
}
