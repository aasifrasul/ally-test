import { useTheme } from '../../../hooks/useTheme';
import { ThemeToggle } from './ThemeToggle';
import { Content } from './Content';

interface MainLayoutProps {
	children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
	const { theme } = useTheme();

	return (
		<div
			className={`min-h-screen ${
				theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
			}`}
		>
			<nav className="p-4 border-b border-gray-200">
				<ThemeToggle />
			</nav>
			<main className="p-4">
				<Content />
				{children}
			</main>
		</div>
	);
};
