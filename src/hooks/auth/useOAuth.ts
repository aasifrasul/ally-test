import { useCallback } from 'react';

function generateRandomState() {
	return (
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15)
	);
}

async function fetchUserInfo(token: string) {
	const response = await fetch('/api/user', {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.json();
}

export function useAuth() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	// Check if user is logged in on component mount
	useEffect(() => {
		checkAuthStatus();
	}, []);

	const checkAuthStatus = async () => {
		try {
			// This will use cookies for web, tokens for mobile
			const response = await fetch('/api/user');

			if (response && response.ok) {
				const userData = await response.json();
				setUser(userData);

				// Store user info locally (safe to do)
				localStorage.setItem('user_info', JSON.stringify(userData));
			}
		} catch (error) {
			console.error('Auth check failed:', error);
		} finally {
			setLoading(false);
		}
	};

	const loginWithOAuth = (provider: string) => {
		setLoading(true);
		setError('');

		// Redirect to OAuth flow
		const params = new URLSearchParams({
			client_id: process.env.REACT_APP_CLIENT_ID,
			redirect_uri: window.location.origin + '/callback',
			scope: 'read:user user:email',
			state: generateRandomState(),
			response_type: 'code',
		} as Record<string, string>);

		window.location.href = `https://${provider}.com/oauth/authorize?${params}`;
	};

	const loginWithSSO = async (username: string, password: string) => {
		try {
			setLoading(true);
			setError('');

			const response = await fetch('/sso/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Client-Type': 'web',
				},
				credentials: 'include',
				body: JSON.stringify({ username, password }),
			});

			const data = await response.json();

			if (response.ok) {
				setUser(data.user);

				// Store token if returned (mobile clients)
				if (data.authToken) {
					localStorage.setItem('access_token', data.authToken);
				}

				return true;
			} else {
				setError(data.error);
				return false;
			}
		} catch (error) {
			setError('Login failed');
			return false;
		} finally {
			setLoading(false);
		}
	};

	const logout = async () => {
		try {
			await fetch('/auth/logout', {
				method: 'POST',
				credentials: 'include',
			});
		} catch (error) {
			console.error('Logout error:', error);
		} finally {
			// Clear local storage
			localStorage.removeItem('access_token');
			localStorage.removeItem('refresh_token');
			localStorage.removeItem('user_info');
			setUser(null);
		}
	};

	return {
		user,
		loading,
		error,
		loginWithOAuth,
		loginWithSSO,
		logout,
		isAuthenticated: !!user,
	};
}
