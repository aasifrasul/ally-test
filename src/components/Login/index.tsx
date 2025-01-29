import React, { useState } from 'react';
import PropTypes from 'prop-types';

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

const endpoint = 'http://localhost:3100/login';

const Login = ({ setToken }: LoginProps) => {
	const [userName, setUserName] = useState<string>('');
	const [password, setPassword] = useState<string>('');

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const options: SubmitOptions = {
			method: 'POST',
			header: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				userName,
				password,
			}),
		};
		const response = await fetch(endpoint, options);
		const token = await response.json();
		setToken(token);
	};
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

Login.propTypes = {
	setToken: PropTypes.func.isRequired,
};

export default Login;
