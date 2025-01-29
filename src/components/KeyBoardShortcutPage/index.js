import React from 'react';

import ImplementKeyBoardShortcut from './ImplementKeyBoardShortcut';
import { KeyBoardShortcutStoreProvider } from '../../Context/KeyBoardShortcutContext';

const KeyBoardShortcutPage = (props) => {
	return (
		<KeyBoardShortcutStoreProvider>
			<ImplementKeyBoardShortcut />
		</KeyBoardShortcutStoreProvider>
	);
};

export default KeyBoardShortcutPage;
