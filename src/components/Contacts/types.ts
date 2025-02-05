export enum ActionType {
	ADD_CONTACT = 'ADD_CONTACT',
	DEL_CONTACT = 'DEL_CONTACT',
	START = 'START',
	COMPLETE = 'COMPLETE',
}

export interface Contact {
	id: number;
	name: string;
	email: string;
}

export interface State {
	contacts: Contact[];
	loading: boolean;
	error: null | string;
}

export interface Action {
	type: string;
	payload?: any;
}

export interface FormData {
	name: string;
	email: string;
}

export interface ChangeEvent {
	target: {
		name: string;
		value: string;
	};
}
