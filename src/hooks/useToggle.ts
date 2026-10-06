import { useState, useCallback } from 'react';
import { isBoolean } from '../utils/typeChecking';

type ToggleFunction = (value?: boolean) => void;

export const useToggle = (initialState: boolean = false): [boolean, ToggleFunction] => {
	const [state, setState] = useState<boolean>(initialState);

	const toggle = useCallback((value?: boolean) => {
		setState((prevState) => (isBoolean(value) ? value : !prevState));
	}, []) as ToggleFunction;

	return [state, toggle];
};
