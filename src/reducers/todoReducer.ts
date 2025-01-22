import { getRandomInt } from '../utils/common';

interface Todo {
	id: number;
	text: string;
	complete: boolean;
}

interface Action {
	type: string;
	payload: {
		id?: number;
		value?: string;
	};
}

const initialState: Todo[] = Array.from({ length: 10 }, (_, i) => ({
	id: getRandomInt(),
	text: `Item ${i + 1}`,
	complete: false,
}));

const todoReducer = (state: Todo[] = initialState, action: Action): Todo[] => {
	const { type, payload } = action;
	switch (type) {
		case 'TODO_TOGGLE':
			return state.map((todo) =>
				todo.id !== payload.id ? todo : { ...todo, complete: !todo.complete },
			);
		case 'TODO_SHOW_UNCOMPLETED':
			return state.filter((todo) => !todo.complete);
		case 'TODO_SHOW_COMPLETED':
			return state.filter((todo) => todo.complete);
		case 'TODO_ADD_NEW':
			return [
				...state,
				{ id: getRandomInt(), text: payload.value || '', complete: false },
			];
		case 'TODO_DELETE':
			return state.filter((todo) => todo.id !== payload.id);
		default:
			return state;
	}
};

export default todoReducer;
