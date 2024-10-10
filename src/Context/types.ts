import { IS_UserData } from '../types/api';

export interface InitialState {
	isLoading?: boolean;
	isError?: boolean;
	isUpdating?: boolean;
	data?: IS_UserData[] | Array<unknown> | Record<string, unknown>;
	currentPage?: number | undefined;
	TOTAL_PAGES?: number;
}

export interface GenericState {
	[key: string]: InitialState;
}
