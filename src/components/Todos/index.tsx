import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import CombinedRefCheckbox from '../Common/Checkbox/CombinedRefCheckbox';
import { InputText } from '../Common/InputText';

interface Todo {
	id: string | number;
	text: string;
	complete: boolean;
}

interface RootState {
	todos: Todo[];
}

interface TodoAction {
	type: string;
	payload: {
		id?: string | number;
		value?: string;
	};
}

const selectTodos = (state: RootState): Todo[] => state.todos;

const Todos: React.FC = () => {
	const [searchText, setSearchText] = React.useState<string>('');
	const [showCompleted, setShowCompleted] = React.useState<boolean>(false);
	const inputTextRef = React.useRef<string>('');
	const isCheckedRef = React.useRef<boolean>(false);

	const todos = useSelector(selectTodos);
	const dispatch = useDispatch();

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		if (inputTextRef.current) {
			fireDispatch('TODO_ADD_NEW', { value: inputTextRef.current });
			inputTextRef.current = '';
		}
	};

	const handleRemoveFromComplete = (id: string | number): void =>
		fireDispatch('TODO_TOGGLE', { id });

	const handleDelete = (id: string | number): void => fireDispatch('TODO_DELETE', { id });

	const handleComplete = (id: string | number): void => fireDispatch('TODO_TOGGLE', { id });

	const fireDispatch = (type: string, payload: TodoAction['payload']): void => {
		dispatch({ type, payload });
	};

	const handleShowCompleted = React.useCallback((): void => {
		setShowCompleted((prev) => !prev);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const searchTextLowercased = searchText.length > 0 ? searchText.toLowerCase() : '';

	const todosHtml: JSX.Element[] = todos
		.filter(({ complete }: Todo) => (showCompleted ? complete : !complete))
		.filter(({ text }: Todo) => {
			if (searchTextLowercased.length > 0) {
				return text.toLowerCase().includes(searchTextLowercased);
			}
			return true;
		})
		.map(({ id, text, complete }: Todo) => (
			<div key={id}>
				<span>{text}</span>
				<span onClick={() => handleDelete(id)}> Delete </span>
				{complete ? (
					<span onClick={() => handleRemoveFromComplete(id)}> UnComplete </span>
				) : (
					<span onClick={() => handleComplete(id)}> Complete </span>
				)}
			</div>
		));

	return (
		<>
			<form onSubmit={handleSubmit}>
				<InputText
					name="Search Item:"
					label="Search Item:"
					initialValue={searchText}
					onChange={(text) => {
						setSearchText(text);
					}}
				/>
				<CombinedRefCheckbox
					name="Show Completed:"
					label="Show Completed:"
					isCheckedRef={isCheckedRef}
					callback={handleShowCompleted}
				/>
				<InputText
					name="Add Item:"
					label="Add Item:"
					onChange={(text) => {
						inputTextRef.current = text;
					}}
				/>
				<input type="submit" value="Submit" />
			</form>
			<div>All the Todos</div>
			<div>{todosHtml}</div>
		</>
	);
};

export default Todos;
