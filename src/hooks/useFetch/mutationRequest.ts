import { DataSource, QueryParams } from '../../constants/types';
import { HTTPMethod, ModifyOptions } from '../../types/api';
import { hasProperty } from '../../utils/typeChecking';
import { buildRequestOptions, buildUrl } from './helpers';

export function normalizeMutationOptions(
	payloadOrConfig: ModifyOptions | Record<string, unknown>,
	config: ModifyOptions,
): ModifyOptions {
	const isConfigObject = (value: unknown): value is ModifyOptions =>
		hasProperty(value, 'method');

	return isConfigObject(payloadOrConfig)
		? payloadOrConfig
		: {
				...config,
				body: JSON.stringify(payloadOrConfig),
			};
}

export function buildMutationRequest(
	baseUrl: string,
	dataSource: DataSource | undefined,
	defaultQueryParams: QueryParams | undefined,
	options: ModifyOptions,
): {
	url: string;
	requestOptions: RequestInit & { method: HTTPMethod; body?: string };
} {
	const {
		method = HTTPMethod.POST,
		headers = {},
		queryParams = {},
		body = '',
		url: overrideUrl,
	} = options;
	const mergedQueryParams = { ...(defaultQueryParams ?? {}), ...queryParams };

	return {
		url: buildUrl(overrideUrl || baseUrl, mergedQueryParams),
		requestOptions: buildRequestOptions(headers, dataSource?.headers, method, body),
	};
}
