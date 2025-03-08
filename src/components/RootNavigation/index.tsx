import { useCallback } from 'react';
import { Link } from 'react-router-dom';

interface RootNavigationProps {
	pages: { [key: string]: React.LazyExoticComponent<React.ComponentType<any>> };
}

export default function RootNavigation({ pages }: RootNavigationProps) {
	const buildNavLinks = useCallback(() => {
		const linksHtml = [];
		for (let name in pages) {
			linksHtml.push(
				<li key={name}>
					<Link to={`/${name}`}>{name}</Link>
				</li>,
			);
		}
		return linksHtml;
	}, [pages]);

	return (
		<nav>
			<ul>{buildNavLinks()}</ul>
		</nav>
	);
}
