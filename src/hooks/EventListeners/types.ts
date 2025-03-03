export type Target = EventTarget | null | undefined;
export type Options = boolean | AddEventListenerOptions;

export interface ErrorHandlingOptions {
	onError?: (error: Error) => void;
	suppressErrors?: boolean;
}

export interface EventMap extends WindowEventMap, DocumentEventMap, HTMLElementEventMap {
	click: MouseEvent;
	mousedown: MouseEvent;
	mouseup: MouseEvent;
	touchstart: TouchEvent;
	touchend: TouchEvent;
}
