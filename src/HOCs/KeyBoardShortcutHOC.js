import React from 'react';

import { useKeyBoardShortcutStore } from '../Context/KeyBoardShortcutContext';

const withKeyBoardShortcut = (WrappedComponent) => {
	function Wrapper(props) {
		const { dispatch } = useKeyBoardShortcutStore();

		const addShortcut = (hash, obj, desc) => {
			dispatch({ type: 'ADD_SHORTCUT', payload: { hash, obj, desc } });
		};
		const removeShortcut = (hash) => {
			dispatch({ type: 'REMOVE_SHORTCUT', payload: { hash } });
		};
		return (
			<WrappedComponent
				{...props}
				addShortcut={addShortcut}
				removeShortcut={removeShortcut}
			/>
		);
	}
	return Wrapper;
};

export default withKeyBoardShortcut;
