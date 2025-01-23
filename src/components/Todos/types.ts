export interface Todo {
	id: string | number;
	text: string;
	complete: boolean;
}

export interface TodoState {
	todos: Todo[];
	searchText: string;
	showCompleted: boolean;
}
