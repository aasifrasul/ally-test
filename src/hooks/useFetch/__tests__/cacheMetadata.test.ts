import { Schema } from '../../../constants/types';
import { invalidateSchema, isSchemaStale, markSchemaFetched } from '../cacheMetadata';

describe('useFetch cache metadata', () => {
	const schema = Schema.INFINITE_SCROLL;

	beforeEach(() => {
		invalidateSchema(schema);
	});

	it('is stale when no fetch has been recorded', () => {
		expect(isSchemaStale(schema, 1000)).toBe(true);
	});

	it('is fresh within the configured stale time', () => {
		jest.spyOn(Date, 'now').mockReturnValue(1000);
		markSchemaFetched(schema);

		jest.spyOn(Date, 'now').mockReturnValue(1500);
		expect(isSchemaStale(schema, 1000)).toBe(false);
	});

	it('becomes stale after the configured stale time', () => {
		jest.spyOn(Date, 'now').mockReturnValue(1000);
		markSchemaFetched(schema);

		jest.spyOn(Date, 'now').mockReturnValue(2001);
		expect(isSchemaStale(schema, 1000)).toBe(true);
	});

	it('invalidates recorded freshness', () => {
		markSchemaFetched(schema);
		invalidateSchema(schema);
		expect(isSchemaStale(schema, 1000)).toBe(true);
	});
});
