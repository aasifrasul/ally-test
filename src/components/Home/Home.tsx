import React from 'react';
import { Link } from 'react-router-dom';

interface HomeProps {
	pages: Record<string, React.LazyExoticComponent<React.ComponentType<any>>>;
}

const Home = (props: HomeProps) => {
	const linksHtml: React.ReactNode[] = [];

	for (let name in props.pages) {
		linksHtml.push(
			<li key={name}>
				<Link to={`/${name}`}>{name}</Link>
			</li>,
		);
	}

	return (
		<div>
			<nav>
				<ul>{linksHtml}</ul>
			</nav>
		</div>
	);
};

export default Home;
