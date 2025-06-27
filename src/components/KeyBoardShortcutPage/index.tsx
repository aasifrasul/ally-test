import React from 'react';

import KeyBoardShortcut from '../Common/KeyBoardShortcut/KeyBoardShortcut';
import Spacer from '../Common/Spacer';

function ImplementKeyBoardShortcut() {
	const containerRef = React.useRef<HTMLDivElement>(null);

	const toggleGreen = () => {
		const element = containerRef?.current;
		if (!element) return;

		const currentColor = element.style.backgroundColor;
		element.style.backgroundColor = currentColor === 'green' ? '' : 'green';
	};

	const toggleRed = () => {
		const element = containerRef?.current;
		if (!element) return;

		const currentColor = element.style.backgroundColor;
		element.style.backgroundColor = currentColor === 'red' ? '' : 'red';
	};

	return (
		<div ref={containerRef}>
			<Spacer size={16} />
			<KeyBoardShortcut
				keyPress="c"
				ctrl={true}
				callback={toggleGreen}
				description="Toggle background color to green"
			/>
			<Spacer size={16} />
			<KeyBoardShortcut
				keyPress="p"
				shift={true}
				callback={toggleRed}
				description="Toggle background color to red"
			/>
		</div>
	);
}

export default ImplementKeyBoardShortcut;
