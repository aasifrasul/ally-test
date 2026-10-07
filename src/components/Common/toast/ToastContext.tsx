import { createContext, useContext, type ReactNode } from 'react';

import { createContextProvider } from '../../../Context/contextProviderFactory';
import type { ToastType, Toast } from './types';

// Generic context state so different consumers can use a different
// message shape or attach metadata to toasts. Defaults keep current
// usage compatible.
export interface ToastContextState<
	TMessage = string,
	TMeta = unknown,
	TToast extends Toast<TMessage, TMeta> = Toast<TMessage, TMeta>,
> {
	toasts: TToast[];
	// `addToast` returns the generated toast id so callers can keep a
	// reference if they want to remove it later.
	addToast: (message: TMessage, type?: ToastType, meta?: TMeta) => string;
	removeToast: (id: string) => void;
}

// Create context using defaults so existing, non-generic consumers still work.
export const ToastContext = createContext<ToastContextState<any, any> | null>(null);

export function createToastContext<TMessage = string, TMeta = unknown>(): [
	React.FC<{ children?: ReactNode; value: ToastContextState<TMessage, TMeta> }>,
	() => ToastContextState<TMessage, TMeta>,
] {
	return createContextProvider(
		ToastContext as React.Context<ToastContextState<TMessage, TMeta> | null>,
		'ToastProvider',
	);
}

export const [ToastContextProvider, useToastContext] = createToastContext();

// Generic hook that narrows the context to the desired message/meta types.
export const useToast = <TMessage = string, TMeta = unknown>(): ToastContextState<
	TMessage,
	TMeta
> => {
	const ctx = useContext(ToastContext) as ToastContextState<TMessage, TMeta> | null;
	if (!ctx) throw new Error('useToast must be used inside ToastProvider');
	return ctx;
};
