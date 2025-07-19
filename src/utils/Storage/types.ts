export enum StorageType {
	LOCAL_STORAGE = 'localStorage',
	SESSION_STORAGE = 'sessionStorage',
	INDEXED_DB = 'indexedDB',
}

export type Keys = string[] | IDBValidKey[];

export interface StorageMapping {
	stringify?: boolean;
	getItem: (key: string) => Promise<any>;
	setItem: (key: string, value: any) => Promise<void>;
	removeItem: (key: string) => Promise<void>;
	contains: (key: string) => Promise<boolean>;
	clear: () => Promise<void>;
	keys: () => Promise<Keys>;
}

export interface StorageCapacity {
	used: number;
	total: number;
	available: number;
}

export interface IStorageAdapter {
	getItem(key: string): Promise<any>;
	setItem(key: string, value: any): Promise<void>;
	removeItem(key: string): Promise<void>;
	contains(key: string): Promise<boolean>;
	clear(): Promise<void>;
	getAllKeys(): Promise<string[]>;
	initialize?(): Promise<void>;
	close?(): void;
}
