import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import CombinedRefCheckbox from '../Common/Checkbox/CombinedRefCheckbox';
import InputText from '../Common/InputText';

const selectTodos = (state) => state.todos;

const Todos = (props) => {
	const inputTextRef = React.useRef('');
	const searchRef = React.useRef('');
	const isCheckedRef = React.useRef(false);
	const [showCompleted, setShowCompleted] = React.useState(false);
	//const todos = useSelector((state) => state.todos);
	const todos = useSelector(selectTodos);

	const dispatch = useDispatch();

	const handleSubmit = (event) => {
		event.preventDefault();
		if (inputTextRef.current) {
			fireDispatch('TODO_ADD_NEW', { value: inputTextRef.current });
			inputTextRef.current = '';
		}
	};

	const handleRemoveFromComplete = (id) => fireDispatch('TODO_TOGGLE', { id });

	const handleDelete = (id) => fireDispatch('TODO_DELETE', { id });

	const handleComplete = (id) => fireDispatch('TODO_TOGGLE', { id });

	const fireDispatch = (type, payload) => dispatch({ type, payload });

	const handleShowCompleted = () => () => setShowCompleted((currentShowCompleted) => !currentShowCompleted);

	const todosHtml = [];
	todos.forEach((item, key) => {
		const { id, text, complete } = item;
		const include = showCompleted ? complete : !complete;
		include &&
			todosHtml.push(
				<div key={id}>
					<span>{text}</span>
					<span onClick={() => handleDelete(id)}> Delete </span>
					{complete ? (
						<span onClick={() => handleRemoveFromComplete(id)}> UnComplete </span>
					) : (
						<span onClick={() => handleComplete(id)}> Complete </span>
					)}
				</div>
			);
	});

	return (
		<>
			<form onSubmit={handleSubmit}>
				<InputText label="Search Item:" defaultValue={searchRef.current} inputTextRef={searchRef} />
				<CombinedRefCheckbox
					name="Show Completed:"
					label="Show Completed:"
					isCheckedRef={isCheckedRef}
					callback={handleShowCompleted()}
				/>
				<InputText label="Add Item:" inputTextRef={inputTextRef} />
				<input type="submit" value="Submit" />
			</form>
			<div>All the Todos</div>
			<div>{todosHtml}</div>
		</>
	);
};

export default Todos;
