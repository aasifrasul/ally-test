import { IS_Item } from '../types/infiniteScroll';

export interface InitialState {
	isLoading?: boolean;
	isError?: boolean;
	isUpdating?: boolean;
	data?: IS_Item[] | Array<unknown> | Record<string, unknown>;
	currentPage?: number | undefined;
	TOTAL_PAGES?: number;
}

export interface GenericState {
	[key: string]: InitialState;
}
