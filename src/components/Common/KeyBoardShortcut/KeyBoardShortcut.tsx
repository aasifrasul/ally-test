import { ShortcutConfig } from './KeyBoardShortcutHelper';
import { useKeyboardShortcut } from '../../../hooks/useKeyBoardShortcut';

interface KeyBoardShortcutProps extends ShortcutConfig {
	description: string;
}

function KeyBoardShortcut(props: KeyBoardShortcutProps): JSX.Element {
	const { keyPress, alt, shift, ctrl, description, callback } = props;

	useKeyboardShortcut({ keyPress, alt, shift, ctrl, callback });

	const modifiers = [ctrl && 'Ctrl', alt && 'Alt', shift && 'Shift']
		.filter(Boolean)
		.join(' + ');

	return (
		<div className="keyboard-shortcut">
			<div>
				Shortcut: <b>{modifiers ? `${modifiers} + ${keyPress}` : keyPress}</b>
			</div>
			<div>Description: {description}</div>
		</div>
	);
}

export default KeyBoardShortcut;
