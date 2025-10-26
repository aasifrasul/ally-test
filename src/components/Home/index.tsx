import React from 'react';
import Spacer from '../Common/Spacer';
import RootNavigation from '../RootNavigation';

interface HomeProps {
	pages: { [key: string]: React.LazyExoticComponent<React.ComponentType<any>> };
}

const Home: React.FC<HomeProps> = (props) => {
	return (
		<div>
			<h1>My Personal Project</h1>
			<Spacer size={16} />
			<RootNavigation pages={props.pages} />
			<Spacer size={16} />
		</div>
	);
};

export default Home;
