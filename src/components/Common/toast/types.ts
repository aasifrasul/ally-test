export type ToastType = 'success' | 'error' | 'info' | 'warning';

// Generic Toast type so callers can provide a different message shape or
// attach optional metadata. Defaults keep existing code working.
export interface Toast<TMessage = string, TMeta = unknown> {
	id: string;
	message: TMessage;
	type: ToastType;
	meta?: TMeta;
}
