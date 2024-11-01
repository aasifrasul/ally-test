export enum StorageType {
	LOCAL_STORAGE = 'localStorage',
	SESSION_STORAGE = 'sessionStorage',
	MAP = 'Map',
	INDEXED_DB = 'IndexedDB',
}

export interface StorageMapping {
	stringify?: boolean;
	getItem: (key: string) => Promise<any>;
	setItem: (key: string, value: any) => Promise<void>;
	removeItem: (key: string) => Promise<void>;
	contains: (key: string) => Promise<boolean>;
}
