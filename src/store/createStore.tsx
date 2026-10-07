import React, { createContext, useMemo, useReducer, ReactNode, Dispatch } from 'react';

import useContextFactory from '../Context/useContextFactory';
import {
	GenericAction,
	GenericReducer,
	GenericState,
	StoreContextValue,
} from '../constants/types';
import { createLogger, LogLevel, Logger } from '../utils/Logger';
import { isObject, isString } from '../utils/typeChecking';

const logger: Logger = createLogger('createStoreContext', {
	level: LogLevel.DEBUG,
});

export function createStoreContext<T extends GenericState>(
	reducer: GenericReducer,
	initialState: T,
	config?: { name?: string },
): [React.FC<{ children: ReactNode }>, () => StoreContextValue<T>] {
	const StoreContext = createContext<StoreContextValue<T> | undefined>(undefined);
	const contextName = config?.name ?? 'StoreContext.Provider';

	const StoreProvider = ({ children }: { children: ReactNode }) => {
		const [state, dispatch] = useReducer(reducer, initialState) as [
			T,
			Dispatch<GenericAction>,
		];

		const protectedState = useMemo(
			() =>
				new Proxy(state, {
					get(target: T, prop: string | symbol) {
						if (isString(prop) && prop in target) {
							const value = target[prop as keyof T];
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

		return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
	};

	StoreProvider.displayName = `${contextName.replace(/\.Provider$/, '')}_Provider`;

	const useStore = useContextFactory(contextName, StoreContext);
	return [StoreProvider, useStore as () => StoreContextValue<T>];
}
