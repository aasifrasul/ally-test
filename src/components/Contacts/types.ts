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

interface AddContactAction {
	type: ActionType.ADD_CONTACT;
	payload: Contact;
}

interface DeleteContactAction {
	type: ActionType.DEL_CONTACT;
	payload: string;
}

interface StartAction {
	type: ActionType.START;
}

interface CompleteAction {
	type: ActionType.COMPLETE;
}

export type Action = AddContactAction | DeleteContactAction | StartAction | CompleteAction;

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
