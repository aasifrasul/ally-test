import { useTheme } from '../../../hooks/useTheme';

export const ThemeToggle = () => {
	const { theme, toggleTheme } = useTheme();

	return (
		<button
			onClick={toggleTheme}
			className={`px-4 py-2 rounded-md ${
				theme === 'dark'
					? 'bg-gray-700 hover:bg-gray-600'
					: 'bg-gray-200 hover:bg-gray-300'
			}`}
		>
			{theme === 'dark' ? '🌞 Light Mode' : '🌙 Dark Mode'}
		</button>
	);
};
