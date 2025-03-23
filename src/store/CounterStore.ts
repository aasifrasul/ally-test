// CounterStore.js
import { createStore } from 'redux';

interface State {
	counter: number;
}

interface Action {
	type: 'INCREMENT' | 'DECREMENT';
}

const initialState: State = {
	counter: 0,
};

const reducer = (state: State = initialState, action: Action) => {
	switch (action.type) {
		case 'INCREMENT':
			return {
				...state,
				counter: state.counter + 1,
			};
		case 'DECREMENT':
			return {
				...state,
				counter: state.counter - 1,
			};
		default:
			return state;
	}
};

const store = createStore(reducer);

export default store;
