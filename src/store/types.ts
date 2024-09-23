export type AnyObject = Record<string, any>;

export interface Store<T extends AnyObject> {
	getState: (schema?: keyof T | null) => Partial<T>;
}

export interface StoreContextValue<T extends AnyObject> {
	dispatch: React.Dispatch<any>;
	store: Store<T>;
}
