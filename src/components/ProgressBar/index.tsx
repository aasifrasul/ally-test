import React, { useState, useEffect } from 'react';

import ProgressBar from '../Common/ProgressBar';

const testData = [
	{ bgcolor: `rgb(135 154 27)`, completed: 80 },
	{ bgcolor: '#6a1b9a', completed: 60 },
	{ bgcolor: '#00695c', completed: 30 },
	{ bgcolor: '#ef6c00', completed: 53 },
];

function App() {
	const [completed, setCompleted] = useState<number>(0);

	useEffect(() => {
		setInterval(() => setCompleted(Math.floor(Math.random() * 100) + 1), 2000);
	}, []);

	return (
		<div className="App">
			<ProgressBar bgcolor={'#6a1b9a'} completed={completed} />
		</div>
	);
}

export default App;
