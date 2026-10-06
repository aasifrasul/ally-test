import { Schema } from '../../../constants/types';
import { HTTPMethod } from '../../../types/api';
import { buildFetchRequest } from '../fetchRequest';
import { buildMutationRequest, normalizeMutationOptions } from '../mutationRequest';

describe('useFetch request builders', () => {
	const dataSource = {
		schema: Schema.INFINITE_SCROLL,
		BASE_URL: 'https://api.test/items',
		headers: { Authorization: 'source-token' },
	};

	it('removes control options from GET requests and applies the next page', () => {
		const request = buildFetchRequest(
			dataSource.BASE_URL,
			dataSource,
			{ page: 1 },
			{ nextPage: 3, force: true, headers: { 'X-Test': 'yes' } },
		);

		expect(request.url).toContain('page=3');
		expect(request.requestOptions).toEqual(
			expect.objectContaining({
				method: HTTPMethod.GET,
				headers: expect.objectContaining({
					Authorization: 'source-token',
					'X-Test': 'yes',
				}),
			}),
		);
		expect(request.requestOptions).not.toHaveProperty('nextPage');
		expect(request.requestOptions).not.toHaveProperty('force');
	});

	it('normalizes a payload into a JSON mutation body', () => {
		expect(normalizeMutationOptions({ name: 'Ada' }, { method: HTTPMethod.PUT })).toEqual({
			method: HTTPMethod.PUT,
			body: JSON.stringify({ name: 'Ada' }),
		});
	});

	it('builds mutation URLs and applies method and headers', () => {
		const request = buildMutationRequest(
			dataSource.BASE_URL,
			dataSource,
			{ page: 1, scope: 'all' },
			{
				method: HTTPMethod.PATCH,
				queryParams: { page: 4 },
				headers: { 'X-Test': 'yes' },
				body: '{}',
			},
		);

		expect(request.url).toContain('page=4');
		expect(request.url).toContain('scope=all');
		expect(request.requestOptions).toEqual(
			expect.objectContaining({
				method: HTTPMethod.PATCH,
				body: '{}',
				headers: expect.objectContaining({
					Authorization: 'source-token',
					'X-Test': 'yes',
				}),
			}),
		);
	});
});
