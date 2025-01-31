import React from 'react';
import { Link } from 'react-router-dom';
import Spacer from '../Common/Spacer/Spacer';

interface HomeProps {
	pages: { [key: string]: React.LazyExoticComponent<React.ComponentType<any>> };
}

const Home: React.FC<HomeProps> = (props) => {
	const linksHtml = [];
	for (let name in props.pages) {
		linksHtml.push(
			<li key={name}>
				<Link to={`/${name}`}>{name}</Link>
			</li>,
		);
	}

	return (
		<div>
			<Spacer size={16} />
			<nav>
				<ul>{linksHtml}</ul>
			</nav>
		</div>
	);
};

export default Home;
