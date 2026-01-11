import React from 'react';
import Spacer from '../Common/Spacer';
import RootNavigation from '../RootNavigation';
import { useToast } from '../Common/toast/ToastContext';
import Button from '../Common/Button';

interface HomeProps {
	pages: { [key: string]: React.LazyExoticComponent<React.ComponentType<any>> };
}

const Home: React.FC<HomeProps> = (props) => {
	const { addToast } = useToast();

	return (
		<div>
			<h1>My Personal Project</h1>
			<Spacer size={16} />
			<RootNavigation pages={props.pages} />
			<Spacer size={16} />
			<Button
				onClick={() => addToast('Saved successfully!', 'success', { timeout: 5000 })}
				primary
			>
				Show Success
			</Button>
			<Spacer size={16} />
			<Button
				primary
				onClick={() => addToast('Something went wrong!', 'error', { timeout: 4000 })}
			>
				Show Error
			</Button>
			<Spacer size={16} />
			<Button
				onClick={() => addToast('You have a new message.', 'info', { timeout: 3000 })}
				primary
			>
				Show Info
			</Button>
			<Spacer size={16} />
			<Button
				onClick={() => addToast('Check your inputs!', 'warning', { timeout: 2000 })}
				primary
			>
				Show Warning
			</Button>
		</div>
	);
};

export default Home;
