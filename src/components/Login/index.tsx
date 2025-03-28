import React, { useState } from 'react';

import { useApi } from '../../utils/api-client/hooks/useApi';
import { constants } from '../../constants';

interface LoginProps {
	setToken: (token: string) => void;
}

interface SubmitOptions {
	method: string;
	header: {
		'Content-Type': string;
	};
	body: string;
}

const url = `${constants.BASE_URL}/login`;

const Login = ({ setToken }: LoginProps) => {
	const [userName, setUserName] = useState<string>('');
	const [password, setPassword] = useState<string>('');

	const { execute, isLoading, error } = useApi<{ token: string }>();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		handleLogin({ userName, password });
	};

	const handleLogin = async (credentials: { userName: string; password: string }) => {
		const options: SubmitOptions = {
			method: 'POST',
			header: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(credentials),
		};

		try {
			const result = await execute(url, options);
			if (result && result.token) {
				setToken(result.token);
			}
		} catch (error) {
			console.error('Login failed:', error);
		}
	};

	if (isLoading) return null;
	if (error) return <div>{error.toString()}</div>;

	return (
		<>
			<div className="bg-black/50 fixed top-0 left-0 w-full h-screen"></div>
			<div className="fixed w-full px-4 py-24 z-50">
				<div className="max-w-[450px] h-[600px] mx-auto bg-black/80 text-white">
					<div className="max-w-[320px] mx-auto py-16">
						<h1>Sign Up Here</h1>
						<form onSubmit={handleSubmit} className="w-full flex flex-col py-4">
							<p className="text-white font-bold">UserName</p>
							<input
								type="text"
								required
								onChange={(e) => setPassword(e.target.value)}
								className="p-3 my-2 rounded text-black"
								placeholder="JohnDoe"
							/>
							<p className="text-white font-bold">PassWord</p>
							<input
								type="password"
								required
								onChange={(e) => setUserName(e.target.value)}
								className="p-3 my-2 rounded text-black"
								placeholder="Please enter a strong password"
							/>
							<button
								type="submit"
								className="bg-red-700 py-3 my-6 rounded font-bold px-4"
							>
								Submit
							</button>
							<div>
								<p>
									<input type="checkbox" />
									Remember Me
								</p>
							</div>
						</form>
					</div>
				</div>
			</div>
		</>
	);
};

export default Login;
