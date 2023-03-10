import React from 'react';

import storeFactory from '../store/storeFactory';

import KeyBoardShortcutReducer from '../reducers/KeyBoardShortcutReducer';

const initialState = {};

const [KeyBoardShortcutStoreProvider, useKeyBoardShortcutStore, useKeyBoardShortcutDispatch] = storeFactory(
	KeyBoardShortcutReducer,
	initialState
);

export { KeyBoardShortcutStoreProvider, useKeyBoardShortcutStore, useKeyBoardShortcutDispatch };
