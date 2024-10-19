import { createContext } from 'react';
import { renderHook } from '@testing-library/react-hooks';

import useContextFactory from '../useContextFactory';

describe('useContextFactory', () => {
	it('should return context value when context is provided', () => {
		const TestContext = createContext<string | undefined>('test-value');
		const useTestContext = useContextFactory('TestContext', TestContext);

		const { result } = renderHook(() => useTestContext());

		expect(result.current).toBe('test-value');
	});

	it('should throw an error when context is not provided', () => {
		const TestContext = createContext<string | undefined>(undefined);
		const useTestContext = useContextFactory('TestContext', TestContext);

		const { result } = renderHook(() => useTestContext());

		expect(result.error).toEqual(
			new Error('useContext must be used within a TestContext'),
		);
	});
});
