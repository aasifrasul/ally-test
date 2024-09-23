export interface InitialState {
	isLoading?: boolean;
	isError?: boolean;
	isUpdating?: boolean;
	data?: Array<unknown> | Record<string, unknown>;
	currentPage?: number | undefined;
	TOTAL_PAGES?: number;
}

export interface StoreSchema {
	[key: string]: InitialState;
}
