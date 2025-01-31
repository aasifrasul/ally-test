export type EventMap = WindowEventMap & HTMLElementEventMap & DocumentEventMap;
export type Target = Window | Document | HTMLElement | null | undefined;
export type Options = boolean | AddEventListenerOptions;

export interface ErrorHandlingOptions {
	onError?: (error: Error) => void;
	suppressErrors?: boolean;
}
