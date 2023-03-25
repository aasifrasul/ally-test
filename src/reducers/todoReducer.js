import { getRandomInt } from '../utils/common';

const defaultState = Array.from({ length: 10 }, (_, i) => ({
	id: getRandomInt(),
	text: `Item ${i + 1}`,
	complete: false,
}));

const todoReducer = (state = defaultState, action) => {
	const { type, payload } = action;
	switch (type) {
		case 'TODO_TOGGLE':
			return state.map((todo) => (todo.id !== payload.id ? todo : { ...todo, complete: !todo.complete }));
		case 'TODO_SHOW_UNCOMPLETED':
			return state.filter((todo) => !todo.complete);
		case 'TODO_SHOW_COMPLETED':
			return state.filter((todo) => todo.complete);
		case 'TODO_ADD_NEW':
			return [...state, { id: getRandomInt(), text: payload.value, complete: false }];
		case 'TODO_DELETE':
			return state.filter((todo, key) => key !== payload.id);
		default:
			return state;
	}
};

export default todoReducer;
