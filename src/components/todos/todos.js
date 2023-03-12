import React, { useState, useEffect, useReducer, useRef } from 'react';
import { connect } from 'react-redux';

import CombinedRefCheckbox from '../Common/Checkbox/CombinedRefCheckbox';
import InputText from '../Common/InputText';

class Todos extends React.Component {
	constructor(props) {
		super(props);
		this.inputTextRef = React.createRef('');
		this.searchRef = React.createRef('');

		this.props = props;

		this.handleSubmit = this.handleSubmit.bind(this);

		this.state = {
			checked: '',
		};
	}

	handleSubmit(event) {
		event.preventDefault();
		if (this.inputTextRef.current) {
			this.props.dispatch({ type: 'TODO_ADD_NEW', payload: { value: this.inputTextRef.current } });
			this.inputTextRef.current = '';
		}
	}

	handleRemoveFromComplete = (key) => this.props.dispatch({ type: 'TODO_UNCOMPLETE', payload: { id: key } });

	handleDelete = (key) => this.props.dispatch({ type: 'TODO_DELETE', payload: { id: key } });

	handleComplete = (key) => this.props.dispatch({ type: 'TODO_COMPLETE', payload: { id: key } });

	handleShowCompleted = () => (isChecked, val) => this.setState({ checked: isChecked });

	render() {
		const todosHtml = [];
		this.props.todos.forEach((item, key) => {
			const { text, complete } = item;
			const include = this.state.checked ? complete : !complete;
			include &&
				todosHtml.push(
					<div key={key}>
						<span>{text}</span>
						<span onClick={() => this.handleDelete(key)}> Delete </span>
						<span onClick={() => this.handleComplete(key)}> Complete </span>
					</div>,
				);
		});

		return (
			<>
				<form onSubmit={this.handleSubmit}>
					<InputText
						label="Search Item:"
						defaultValue={this.searchRef.current}
						inputTextRef={this.searchRef}
					/>
					<CombinedRefCheckbox
						name="Show Completed:"
						label="Show Completed:"
						callback={this.handleShowCompleted()}
					/>
					<InputText
						label="Add Item:"
						defaultValue={this.inputTextRef.current}
						inputTextRef={this.inputTextRef}
					/>
					<input type="submit" value="Submit" />
				</form>
				<div>All the Todos</div>
				<div>{todosHtml}</div>
			</>
		);
	}
}

const mapStateToProps = (state) => {
	return { todos: state.todoReducer };
};

const mapDispatchToProps = (dispatch) => {
	return {
		dispatch,
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(Todos);
