import { TodoState } from './types';
import {
	TODO_ADD,
	TODO_TOGGLE,
	TODO_DELETE,
	SET_SEARCH_TEXT,
	TOGGLE_SHOW_COMPLETED,
} from './ActionTypes';

const todos = Array.from({ length: 10 }, (_, i) => ({
	id: Date.now() + i,
	text: `Item ${i + 1}`,
	complete: false,
}));

const initialState: TodoState = {
	todos,
	searchText: '',
	showCompleted: false,
};

export const todosReducer = (state = initialState, action: any): TodoState => {
	switch (action.type) {
		case TODO_ADD:
			return {
				...state,
				todos: [
					...state.todos,
					{
						id: Date.now(),
						text: action.payload.text,
						complete: false,
					},
				],
			};

		case TODO_TOGGLE:
			return {
				...state,
				todos: state.todos.map((todo) =>
					todo.id === action.payload.id
						? { ...todo, complete: !todo.complete }
						: todo,
				),
			};

		case TODO_DELETE:
			return {
				...state,
				todos: state.todos.filter((todo) => todo.id !== action.payload.id),
			};

		case SET_SEARCH_TEXT:
			return {
				...state,
				searchText: action.payload.text,
			};

		case TOGGLE_SHOW_COMPLETED:
			return {
				...state,
				showCompleted: !state.showCompleted,
			};

		default:
			return state;
	}
};
