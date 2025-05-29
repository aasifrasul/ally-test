export type EffectCleanup = () => void;
export type SignalEquals<T> = (a: T, b: T) => boolean;
export type ErrorHandler = (error: Error) => void;

export interface Effect {
	disposed: boolean;
	name?: string;
	execute(): void;
	dispose(): void;
}

export interface SignalOptions<T> {
	name?: string;
	equals?: SignalEquals<T>;
}

export interface EffectOptions {
	name?: string;
	onError?: ErrorHandler;
}

export interface ComputedOptions<T> {
	name?: string;
	equals?: SignalEquals<T>;
}

export interface ReactiveConfig {
	maxDepth?: number;
}

export interface SignalReader<T> {
	(): T;
	signalName?: string;
}

export interface SignalWriter<T> {
	(value: T): void;
	signalName?: string;
}

export interface ComputedReader<T> {
	(): T;
	dispose(): void;
	computedName?: string;
}

export interface ReactiveRoot<T> {
	result: T;
	dispose(): void;
}

export interface SignalGraph {
	signals: Map<string, unknown>;
	effects: Map<string, Effect>;
	connections: Array<{ from: string; to: string }>;
}
