import React from 'react';
import { createSelector } from 'reselect';

import { TodoState } from './types';

export const selectTodosState = (state: { todos: TodoState }) => state.todos;

export const selectFilteredTodos = createSelector([selectTodosState], (todosState) => {
	const { todos, searchText = '', showCompleted = false } = todosState;

	return todos.filter(
		(todo) =>
			(showCompleted ? todo.complete : !todo.complete) &&
			(searchText.length === 0 ||
				todo.text.toLowerCase().includes(searchText.toLowerCase())),
	);
});
