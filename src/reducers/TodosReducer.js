const defaultState = Array.from({ length: 10 }, (_, i) => ({ text: `Item ${i + 1}`, complete: false }));

const todoReducer = (state = defaultState, action) => {
	const { type, payload } = action;
	switch (type) {
		case 'TODO_COMPLETE':
			return state.map((todo, key) => {
				if (key === payload.id) {
					return { ...todo, complete: true };
				} else {
					return todo;
				}
			});
		case 'TODO_UNCOMPLETE':
			return state.map((todo, key) => {
				if (key === payload.id) {
					return { ...todo, complete: false };
				} else {
					return todo;
				}
			});
		case 'TODO_SHOW_UNCOMPLETED':
			return state.filter((todo) => !todo.complete);
		case 'TODO_SHOW_COMPLETED':
			return state.filter((todo) => todo.complete);
		case 'TODO_ADD_NEW':
			return [...state, { text: payload.value, complete: false }];
		case 'TODO_DELETE':
			return state.filter((todo, key) => key !== payload.id);
		default:
			return state;
	}
};

export default todoReducer;
