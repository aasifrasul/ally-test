import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
	addTodo,
	deleteTodo,
	toggleTodo,
	toggleShowCompleted,
	setSearchText,
} from './ActionCreators';
import { selectFilteredTodos, selectTodosState } from './selectors';

import CombinedRefCheckbox from '../Common/Checkbox/CombinedRefCheckbox';
import { InputText } from '../Common/InputText';

const TodoList: React.FC = () => {
	const dispatch = useDispatch();
	const filteredTodos = useSelector(selectFilteredTodos);
	const { searchText, showCompleted } = useSelector(selectTodosState);

	const [newTodoText, setNewTodoText] = React.useState('');

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (newTodoText.trim()) {
			dispatch(addTodo(newTodoText));
			setNewTodoText('');
		}
	};

	return (
		<div>
			<form onSubmit={handleSubmit}>
				<input
					type="text"
					placeholder="Search todos"
					value={searchText}
					onChange={(e) => dispatch(setSearchText(e.target.value))}
				/>

				<label>
					<input
						type="checkbox"
						checked={showCompleted}
						onChange={() => dispatch(toggleShowCompleted())}
					/>
					Show Completed
				</label>

				<input
					type="text"
					placeholder="Add new todo"
					value={newTodoText}
					onChange={(e) => setNewTodoText(e.target.value)}
				/>

				<button type="submit">Add Todo</button>
			</form>

			<div>
				{filteredTodos.map((todo) => (
					<div key={todo.id}>
						<span>{todo.text}</span>
						<button onClick={() => dispatch(toggleTodo(todo.id))}>
							{todo.complete ? 'Uncomplete' : 'Complete'}
						</button>
						<button onClick={() => dispatch(deleteTodo(todo.id))}>Delete</button>
					</div>
				))}
			</div>
		</div>
	);
};

export default TodoList;
