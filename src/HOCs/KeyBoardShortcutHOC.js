import React, { useReducer, useEffect } from 'react';

import { useDispatch } from '../Context/KeyBoardShortcutContext';

const withKeyBoardShortcut = (WrappedComponent) => {
	function Wrapper(props) {
		const dispatch = useDispatch();

		const addShortcut = (hash, obj, desc) => {
			dispatch({ type: 'ADD_SHORTCUT', payload: { hash, obj, desc } });
		};
		const removeShortcut = (hash) => {
			dispatch({ type: 'REMOVE_SHORTCUT', payload: { hash } });
		};
		return <WrappedComponent {...props} addShortcut={addShortcut} removeShortcut={removeShortcut} />;
	}
	return Wrapper;
};

export default withKeyBoardShortcut;
