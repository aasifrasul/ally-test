import React, { createContext, useReducer, useMemo, ReactNode, Dispatch } from 'react';

import useContextFactory from '../Context/useContextFactory';

import {
	GenericState,
	GenericReducer,
	GenericAction,
	Schema,
	StoreContextValue,
	Store,
} from '../constants/types';

import { createLogger, LogLevel, Logger } from '../utils/Logger';
import { isObject } from '../utils/typeChecking';

const logger: Logger = createLogger('storeFactory', {
	level: LogLevel.DEBUG,
});

function storeFactory<T extends GenericState>(
	reducer: GenericReducer,
	initialState: T,
): [React.FC<{ children: ReactNode }>, () => StoreContextValue<T>] {
	const GenericContext = createContext<StoreContextValue<T> | undefined>(undefined);

	const StoreProvider = (props: { children: ReactNode }) => {
		const [state, dispatch] = useReducer(reducer, initialState) as [
			T,
			Dispatch<GenericAction>,
		];

		// Proxy the state itself to prevent mutations
		const protectedState = useMemo(
			() =>
				new Proxy(state, {
					get(target: T, prop: Schema) {
						if (typeof prop === 'string' && prop in target) {
							const value = target[prop as keyof T];

							// Deep freeze objects to prevent nested mutations
							return isObject(value) ? Object.freeze({ ...value }) : value;
						}
						logger.warn(`Schema "${String(prop)}" not found in store`);
						return undefined;
					},
					set(target: T, prop: string | symbol) {
						logger.error(
							`Cannot modify store directly. Attempted to set "${String(prop)}". Use dispatch instead.`,
						);
						return false;
					},
					deleteProperty(target: T, prop: string | symbol) {
						logger.error(
							`Cannot delete "${String(prop)}" from store. Use dispatch instead.`,
						);
						return false;
					},
				}) as T,
			[state],
		);

		const value = useMemo(
			() => ({
				state: protectedState,
				dispatch,
			}),
			[protectedState, dispatch],
		);

		return (
			<GenericContext.Provider value={value}>{props.children}</GenericContext.Provider>
		);
	};

	StoreProvider.displayName = `${typeof initialState}_StoreProvider`;

	const useStore = useContextFactory('GenericContext.Provider', GenericContext);

	return [StoreProvider, useStore as () => StoreContextValue<T>];
}

export default storeFactory;
