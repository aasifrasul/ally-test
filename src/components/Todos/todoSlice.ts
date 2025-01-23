import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { client } from '../../api/client';
import { StatusFilters } from '../filters/filtersSlice';
import { RootState, AppDispatch } from '../../store'; // You'll need to create these types

// Define interfaces
interface Todo {
	id: string;
	text: string;
	completed: boolean;
	color?: string;
}

interface TodosState {
	status: 'idle' | 'loading';
	entities: {
		[key: string]: Todo;
	};
}

interface TodoColorPayload {
	todoId: string;
	color: string;
}

const initialState: TodosState = {
	status: 'idle',
	entities: {},
};

const todosSlice = createSlice({
	name: 'todos',
	initialState,
	reducers: {
		todoAdded(state, action: PayloadAction<Todo>) {
			const todo = action.payload;
			state.entities[todo.id] = todo;
		},
		todoToggled(state, action: PayloadAction<string>) {
			const todoId = action.payload;
			const todo = state.entities[todoId];
			todo.completed = !todo.completed;
		},
		todoColorSelected: {
			reducer(state, action: PayloadAction<TodoColorPayload>) {
				const { color, todoId } = action.payload;
				state.entities[todoId].color = color;
			},
			prepare(todoId: string, color: string) {
				return {
					payload: { todoId, color },
				};
			},
		},
		todoDeleted(state, action: PayloadAction<string>) {
			delete state.entities[action.payload];
		},
		allTodosCompleted(state) {
			Object.values(state.entities).forEach((todo) => {
				todo.completed = true;
			});
		},
		completedTodosCleared(state) {
			Object.values(state.entities).forEach((todo) => {
				if (todo.completed) {
					delete state.entities[todo.id];
				}
			});
		},
		todosLoading(state) {
			state.status = 'loading';
		},
		todosLoaded(state, action: PayloadAction<Todo[]>) {
			const newEntities: { [key: string]: Todo } = {};
			action.payload.forEach((todo) => {
				newEntities[todo.id] = todo;
			});
			state.entities = newEntities;
			state.status = 'idle';
		},
	},
});

export const {
	allTodosCompleted,
	completedTodosCleared,
	todoAdded,
	todoColorSelected,
	todoDeleted,
	todoToggled,
	todosLoaded,
	todosLoading,
} = todosSlice.actions;

export default todosSlice.reducer;

// Thunk functions
export const fetchTodos = () => async (dispatch: AppDispatch) => {
	dispatch(todosLoading());
	const response = await client.get('/fakeApi/todos');
	dispatch(todosLoaded(response.todos));
};

interface InitialTodo {
	text: string;
}

export function saveNewTodo(text: string) {
	return async function saveNewTodoThunk(dispatch: AppDispatch) {
		const initialTodo: InitialTodo = { text };
		const response = await client.post('/fakeApi/todos', { todo: initialTodo });
		dispatch(todoAdded(response.todo));
	};
}

// Selectors
const selectTodoEntities = (state: RootState) => state.todos.entities;

export const selectTodos = createSelector(selectTodoEntities, (entities) =>
	Object.values(entities),
);

export const selectTodoById = (state: RootState, todoId: string): Todo | undefined => {
	return selectTodoEntities(state)[todoId];
};

export const selectTodoIds = createSelector(selectTodos, (todos: Todo[]) =>
	todos.map((todo) => todo.id),
);

interface Filters {
	status: (typeof StatusFilters)[keyof typeof StatusFilters];
	colors: string[];
}

export const selectFilteredTodos = createSelector(
	selectTodos,
	(state: RootState) => state.filters,
	(todos, filters: Filters) => {
		const { status, colors } = filters;
		const showAllCompletions = status === StatusFilters.All;
		if (showAllCompletions && colors.length === 0) {
			return todos;
		}

		const completedStatus = status === StatusFilters.Completed;
		return todos.filter((todo: Todo) => {
			const statusMatches = showAllCompletions || todo.completed === completedStatus;
			const colorMatches = colors.length === 0 || colors.includes(todo.color ?? '');
			return statusMatches && colorMatches;
		});
	},
);

export const selectFilteredTodoIds = createSelector(selectFilteredTodos, (filteredTodos) =>
	filteredTodos.map((todo: Todo) => todo.id),
);
