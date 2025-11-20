import { ChangeEvent, MouseEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle } from 'lucide-react';
import { fetchAPIData } from '../../utils/AsyncUtil';
import { HTTPMethod } from '../../types/api';
import { useAuth } from '../../Context/AuthProvider';

export default function Login() {
	const [isLogin, setIsLogin] = useState(true);
	const [showPassword, setShowPassword] = useState(false);
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const navigate = useNavigate();
	const { login } = useAuth();

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		if (errors[name]) {
			setErrors((prev) => ({
				...prev,
				[name]: '',
			}));
		}
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!isLogin && !formData.name.trim()) {
			newErrors.name = 'Name is required';
		}

		if (!formData.email.trim()) {
			newErrors.email = 'Email is required';
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = 'Email is invalid';
		}

		if (!formData.password) {
			newErrors.password = 'Password is required';
		} else if (formData.password.length < 6) {
			newErrors.password = 'Password must be at least 6 characters';
		}

		if (!isLogin && formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = 'Passwords do not match';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		if (validateForm()) {
			if (isLogin) {
				const result: boolean = await login(formData);
				if (result) {
					navigate('/', { replace: true });
				}
			} else {
				handleRegister();
			}
		}
	};

	const handleRegister = async () => {
		const result = await fetchAPIData(`/auth/register`, {
			method: HTTPMethod.POST,
			body: JSON.stringify(formData),
		});
		if (result.success && (result.data as any)?.success) {
			navigate('/login', { replace: true });
		}
	};

	const toggleMode = () => {
		setIsLogin(!isLogin);
		setFormData({
			name: '',
			email: '',
			password: '',
			confirmPassword: '',
		});
		setErrors({});
		setShowPassword(false);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
					<div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
						<div className="flex justify-center mb-4">
							<div className="bg-white bg-opacity-20 p-3 rounded-full">
								<Lock size={32} />
							</div>
						</div>
						<h2 className="text-3xl font-bold text-center mb-2">
							{isLogin ? 'Welcome Back' : 'Create Account'}
						</h2>
						<p className="text-center text-indigo-100">
							{isLogin ? 'Sign in to continue' : 'Sign up to get started'}
						</p>
					</div>

					<div className="p-8">
						{!isLogin && (
							<div className="mb-4">
								<label className="block text-gray-700 text-sm font-semibold mb-2">
									Full Name
								</label>
								<div className="relative">
									<User
										className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
										size={20}
									/>
									<input
										type="text"
										name="name"
										value={formData.name}
										onChange={handleChange}
										className={`w-full pl-10 pr-4 py-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
										placeholder="John Doe"
									/>
								</div>
								{errors.name && (
									<div className="flex items-center mt-1 text-red-500 text-sm">
										<AlertCircle size={14} className="mr-1" />
										{errors.name}
									</div>
								)}
							</div>
						)}

						<div className="mb-4">
							<label className="block text-gray-700 text-sm font-semibold mb-2">
								Email Address
							</label>
							<div className="relative">
								<Mail
									className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
									size={20}
								/>
								<input
									type="email"
									name="email"
									value={formData.email}
									onChange={handleChange}
									className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
									placeholder="you@example.com"
								/>
							</div>
							{errors.email && (
								<div className="flex items-center mt-1 text-red-500 text-sm">
									<AlertCircle size={14} className="mr-1" />
									{errors.email}
								</div>
							)}
						</div>

						<div className="mb-4">
							<label className="block text-gray-700 text-sm font-semibold mb-2">
								Password
							</label>
							<div className="relative">
								<Lock
									className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
									size={20}
								/>
								<input
									type={showPassword ? 'text' : 'password'}
									name="password"
									value={formData.password}
									onChange={handleChange}
									className={`w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
									placeholder="••••••••"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
								>
									{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
								</button>
							</div>
							{errors.password && (
								<div className="flex items-center mt-1 text-red-500 text-sm">
									<AlertCircle size={14} className="mr-1" />
									{errors.password}
								</div>
							)}
						</div>

						{!isLogin && (
							<div className="mb-4">
								<label className="block text-gray-700 text-sm font-semibold mb-2">
									Confirm Password
								</label>
								<div className="relative">
									<Lock
										className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
										size={20}
									/>
									<input
										type={showPassword ? 'text' : 'password'}
										name="confirmPassword"
										value={formData.confirmPassword}
										onChange={handleChange}
										className={`w-full pl-10 pr-4 py-3 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
										placeholder="••••••••"
									/>
								</div>
								{errors.confirmPassword && (
									<div className="flex items-center mt-1 text-red-500 text-sm">
										<AlertCircle size={14} className="mr-1" />
										{errors.confirmPassword}
									</div>
								)}
							</div>
						)}

						{isLogin && (
							<div className="flex justify-end mb-6">
								<button
									type="button"
									className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
								>
									Forgot Password?
								</button>
							</div>
						)}

						<button
							onClick={handleSubmit}
							className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition transform hover:scale-105 shadow-lg"
						>
							{isLogin ? 'Sign In' : 'Create Account'}
						</button>

						<div className="mt-6 text-center">
							<p className="text-gray-600">
								{isLogin
									? "Don't have an account? "
									: 'Already have an account? '}
								<button
									type="button"
									onClick={toggleMode}
									className="text-indigo-600 hover:text-indigo-800 font-semibold"
								>
									{isLogin ? 'Sign Up' : 'Sign In'}
								</button>
							</p>
						</div>
					</div>
				</div>

				<p className="text-center text-white text-sm mt-4 opacity-80">
					Protected by JWT Authentication
				</p>
			</div>
		</div>
	);
}
