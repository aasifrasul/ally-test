import { useState, useCallback, useMemo } from 'react';

import { ToastContext } from './ToastContext';
import type { ToastType, Toast } from './types';
import ToastContainer from './ToastContainer';

export default function ToastProvider<TMessage = string, TMeta = unknown>({
	children,
}: {
	children: React.ReactNode;
}) {
	const [toasts, setToasts] = useState<Toast<TMessage, TMeta>[]>([]);

	const addToast = useCallback(
		(message: TMessage, type: ToastType = 'info', meta?: TMeta): string => {
			const id = crypto.randomUUID();
			const newToast: Toast<TMessage, TMeta> = { id, message, type, meta };

			setToasts((prev) => [...prev, newToast]);
			const timeout =
				meta && (meta as any).dismissible === false
					? null
					: (meta as any).timeout || 3000;

			// Auto-remove toast after 3 seconds unless specified otherwise
			if (timeout !== null) {
				setTimeout(removeToast, timeout, id);
			}

			// Return the created toast id so callers can remove it if needed
			return id;
		},
		[setToasts],
	);

	const removeToast = useCallback(
		(id: string): void => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		},
		[setToasts],
	);

	const contextValue = useMemo(
		() => ({
			toasts,
			addToast: addToast as (
				message: TMessage,
				type?: ToastType,
				meta?: TMeta,
			) => string,
			removeToast: removeToast as (id: string) => void,
		}),
		[toasts, addToast, removeToast],
	);

	return (
		<ToastContext.Provider value={contextValue as any}>
			{children}
			<ToastContainer />
		</ToastContext.Provider>
	);
}
