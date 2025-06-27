import { Link } from 'react-router-dom';

interface RootNavigationProps {
	pages: { [key: string]: React.LazyExoticComponent<React.ComponentType<any>> };
}

export default function RootNavigation({ pages }: RootNavigationProps) {
	return (
		<nav>
			<ul>
				{Object.keys(pages).map((name) => (
					<li key={name}>
						<Link to={`/${name}`}>{name}</Link>
					</li>
				))}
			</ul>
		</nav>
	);
}
