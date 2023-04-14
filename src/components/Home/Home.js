import React from 'react';
import { Link } from 'react-router-dom';

const Home = (props) => {
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
			<nav>
				<ul>{linksHtml}</ul>
			</nav>
		</div>
	);
};

export default Home;
