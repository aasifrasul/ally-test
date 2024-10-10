import { Action, GenericState } from '../constants/types';

export interface Store<T extends GenericState> {
	getState: (schema?: keyof T | null) => Partial<T>;
}

export interface StoreContextValue<T extends GenericState> {
	dispatch: React.Dispatch<Action>;
	store: Store<T>;
}
