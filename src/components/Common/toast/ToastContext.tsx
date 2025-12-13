import { createContext, useContext } from 'react';
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

// Generic hook that narrows the context to the desired message/meta types.
export const useToast = <TMessage = string, TMeta = unknown>(): ToastContextState<
	TMessage,
	TMeta
> => {
	const ctx = useContext(ToastContext) as ToastContextState<TMessage, TMeta> | null;
	if (!ctx) throw new Error('useToast must be used inside ToastProvider');
	return ctx;
};
