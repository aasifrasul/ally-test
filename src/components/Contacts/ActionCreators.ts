import { Contact } from './types';
import { ActionType } from './types';

export const addContact = (contact: Contact) => ({
	type: ActionType.ADD_CONTACT,
	payload: contact,
});

export const deleteContact = (id: number) => ({
	type: ActionType.DEL_CONTACT,
	payload: id,
});
