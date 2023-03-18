import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import CombinedRefCheckbox from '../Common/Checkbox/CombinedRefCheckbox';
import InputText from '../Common/InputText';

const Todos = (props) => {
	const inputTextRef = React.useRef('');
	const searchRef = React.useRef('');
	const isCheckedRef = React.useRef(false);
	const [showCompleted, setShowCompleted] = React.useState(false);
	const todos = useSelector((state) => state.todos);

	const dispatch = useDispatch();

	const handleSubmit = (event) => {
		event.preventDefault();
		if (inputTextRef.current) {
			fireDispatch('TODO_ADD_NEW', { value: inputTextRef.current });
			inputTextRef.current = '';
		}
	};

	const handleRemoveFromComplete = (key) => fireDispatch('TODO_UNCOMPLETE', { id: key });

	const handleDelete = (key) => fireDispatch('TODO_DELETE', { id: key });

	const handleComplete = (key) => fireDispatch('TODO_COMPLETE', { id: key });

	const fireDispatch = (type, payload) => dispatch({ type, payload });

	const handleShowCompleted = () => () => setShowCompleted((currentShowCompleted) => !currentShowCompleted);

	const todosHtml = [];
	todos.forEach((item, key) => {
		const { text, complete } = item;
		const include = showCompleted ? complete : !complete;
		include &&
			todosHtml.push(
				<div key={key}>
					<span>{text}</span>
					<span onClick={() => handleDelete(key)}> Delete </span>
					{complete ? (
						<span onClick={() => handleRemoveFromComplete(key)}> UnComplete </span>
					) : (
						<span onClick={() => handleComplete(key)}> Complete </span>
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
				<InputText label="Add Item:" defaultValue={inputTextRef.current} inputTextRef={inputTextRef} />
				<input type="submit" value="Submit" />
			</form>
			<div>All the Todos</div>
			<div>{todosHtml}</div>
		</>
	);
};

export default Todos;
