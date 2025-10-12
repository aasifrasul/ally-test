import { useTheme } from '../../../hooks/useTheme';
import Spacer from '../Spacer';
import { useAuth } from '../../../Context/AuthProvider';

export const Content = () => {
	const { isDark } = useTheme();
	const { logout } = useAuth();

	return (
		<>
			<div className="space-y-4">
				<h1 className="text-2xl font-bold">Welcome to our app!</h1>
				<p>Current theme: {isDark ? 'Dark' : 'Light'}</p>
			</div>
			<div className="space-y-4 float-right">
				<button onClick={logout}>
					<b>Logout</b>
				</button>
			</div>
			<Spacer size={16} />
		</>
	);
};
