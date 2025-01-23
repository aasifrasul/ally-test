import {
	TODO_ADD,
	TODO_TOGGLE,
	TODO_DELETE,
	SET_SEARCH_TEXT,
	TOGGLE_SHOW_COMPLETED,
} from './ActionTypes';

export const addTodo = (text: string) => ({
	type: TODO_ADD,
	payload: { text },
});

export const toggleTodo = (id: string | number) => ({
	type: TODO_TOGGLE,
	payload: { id },
});

export const deleteTodo = (id: string | number) => ({
	type: TODO_DELETE,
	payload: { id },
});

export const setSearchText = (text: string) => ({
	type: SET_SEARCH_TEXT,
	payload: { text },
});

export const toggleShowCompleted = () => ({
	type: TOGGLE_SHOW_COMPLETED,
});
