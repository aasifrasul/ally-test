import React from 'react';
import Spacer from '../Common/Spacer';
import RootNavigation from '../RootNavigation';
import { useToast } from '../Common/toast/ToastContext';

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
			<button
				onClick={() => addToast('Saved successfully!', 'success', { timeout: 5000 })}
				className="px-4 py-2 bg-blue-600 text-white rounded-md"
			>
				Show Success
			</button>
			<Spacer size={16} />
			<button
				onClick={() => addToast('Something went wrong!', 'error', { timeout: 4000 })}
				className="px-4 py-2 bg-blue-600 text-white rounded-md"
			>
				Show Error
			</button>
			<Spacer size={16} />
			<button
				onClick={() => addToast('You have a new message.', 'info', { timeout: 3000 })}
				className="px-4 py-2 bg-blue-600 text-white rounded-md"
			>
				Show Info
			</button>
			<Spacer size={16} />
			<button
				onClick={() => addToast('Check your inputs!', 'warning', { timeout: 2000 })}
				className="px-4 py-2 bg-blue-600 text-white rounded-md"
			>
				Show Warning
			</button>
		</div>
	);
};

export default Home;
