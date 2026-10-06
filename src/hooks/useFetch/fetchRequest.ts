import { DataSource } from '../../constants/types';
import { CustomFetchOptions, HTTPMethod } from '../../types/api';
import { buildRequestOptions, buildUrl } from './helpers';

export function buildFetchRequest(
	endpoint: string,
	dataSource: DataSource | undefined,
	defaultQueryParams: Record<string, unknown> | undefined,
	options: CustomFetchOptions,
): {
	url: string;
	requestOptions: RequestInit & { method: HTTPMethod; body?: any };
} {
	const cleanOptions = { ...options };
	delete cleanOptions.nextPage;
	delete (cleanOptions as Partial<CustomFetchOptions>).force;

	const url = buildUrl(endpoint, defaultQueryParams, options.nextPage);
	const requestOptions = {
		...cleanOptions,
		...buildRequestOptions(
			cleanOptions.headers as Record<string, string> | undefined,
			dataSource?.headers,
			HTTPMethod.GET,
		),
	};

	return {
		url,
		requestOptions: { ...requestOptions, method: HTTPMethod.GET },
	};
}
