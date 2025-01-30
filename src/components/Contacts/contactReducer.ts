import { ActionType, Action, State } from './types';

const initialState: State = {
	contacts: [
		{
			id: 101,
			name: 'Diana Prince',
			email: 'diana@us.army.mil',
		},
		{
			id: 102,
			name: 'Bruce Wayne',
			email: 'bruce@batmail.com',
		},
		{
			id: 103,
			name: 'Clark Kent',
			email: 'clark@metropolitan.com',
		},
	],
	loading: false,
	error: null,
};

export const contactReducer = (state: State = initialState, action: Action): State => {
	switch (action.type) {
		case ActionType.ADD_CONTACT:
			return {
				...state,
				contacts: [...state.contacts, action.payload],
			};
		case ActionType.DEL_CONTACT:
			return {
				...state,
				contacts: state.contacts.filter(
					(contact) => contact.id !== Number(action.payload),
				),
			};
		case ActionType.START:
			return {
				...state,
				loading: true,
			};
		case ActionType.COMPLETE:
			return {
				...state,
				loading: false,
			};
		default:
			return state;
	}
};
