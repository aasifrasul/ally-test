import KeyBoardShortcut from '../Common/KeyBoardShortcut/KeyBoardShortcut';
import Spacer from '../Common/Spacer/Spacer';

function ImplementKeyBoardShortcut() {
	const toggleGreen = () => {
		const currentColor = document.body.style.backgroundColor;
		document.body.style.backgroundColor = currentColor === 'green' ? '' : 'green';
	};

	const toggleRed = () => {
		const currentColor = document.body.style.backgroundColor;
		document.body.style.backgroundColor = currentColor === 'red' ? '' : 'red';
	};

	return (
		<div>
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
