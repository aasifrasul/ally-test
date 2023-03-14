import React from 'react';
import { connect } from 'react-redux';

import CombinedRefCheckbox from '../Common/Checkbox/CombinedRefCheckbox';
import InputText from '../Common/InputText';

class Todos extends React.Component {
	constructor(props) {
		super(props);
		this.inputTextRef = React.createRef('');
		this.searchRef = React.createRef('');
		this.isCheckedRef = React.createRef(false);

		this.props = props;

		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(event) {
		event.preventDefault();
		if (this.inputTextRef.current) {
			this.dispatch('TODO_ADD_NEW', { value: this.inputTextRef.current });
			this.inputTextRef.current = '';
		}
	}

	handleRemoveFromComplete = (key) => this.dispatch('TODO_UNCOMPLETE', { id: key });

	handleDelete = (key) => this.dispatch('TODO_DELETE', { id: key });

	handleComplete = (key) => this.dispatch('TODO_COMPLETE', { id: key });

	dispatch = (type, payload) => this.props.dispatch({ type, payload });

	handleShowCompleted = () => {
		this.forceUpdate();
	};

	render() {
		const todosHtml = [];
		this.props.todos.forEach((item, key) => {
			const { text, complete } = item;
			const include = this.isCheckedRef.current ? complete : !complete;
			include &&
				todosHtml.push(
					<div key={key}>
						<span>{text}</span>
						<span onClick={() => this.handleDelete(key)}> Delete </span>
						<span onClick={() => this.handleComplete(key)}> Complete </span>
					</div>
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
						isCheckedRef={this.isCheckedRef}
						callback={() => this.handleShowCompleted()}
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
