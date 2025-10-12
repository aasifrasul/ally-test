declare module '*.module.css';
declare module '*.module.scss';

declare global {
	interface Window {
		__DEV_HMR_STATUS__?: () => void;
	}

	declare module '*.png' {
		const value: string;
		export default value;
	}

	namespace NodeJS {
		interface Module {
			hot?: {
				accept(
					dependencies?: string | string[] | RegExp,
					callback?: (updatedDependencies?: string[]) => void,
				): void;
				accept(dependency: string | RegExp, callback?: () => void): void;
				accept(callback?: (err?: Error) => void): void;
				decline(dependencies?: string | string[]): void;
				dispose(callback: (data: any) => void): void;
				addErrorHandler(callback: (err: Error) => void): void;
				addStatusHandler(callback: (status: string) => void): void;
				removeStatusHandler(callback: (status: string) => void): void;
				status(): string;
				check(autoApply?: boolean): Promise<string[]>;
				apply(options?: any): Promise<string[]>;
				addDisposeHandler(callback: (data: any) => void): void;
				removeDisposeHandler(callback: (data: any) => void): void;
				invalidate(): void;
			};
		}
		interface ProcessEnv {
			JWT_SECRET: string;
			JWT_EXPIRES_IN: string;
		}
	}
}

export {};
