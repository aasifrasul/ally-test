import { useTheme } from '../../../hooks/useTheme';

export const Content = () => {
	const { isDark } = useTheme();

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Welcome to our app!</h1>
			<p>Current theme: {isDark ? 'Dark' : 'Light'}</p>
		</div>
	);
};
