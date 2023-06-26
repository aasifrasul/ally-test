import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import useStorage from '.';

describe('useStorage', () => {
	beforeEach(() => {
		// Mock localStorage
		delete window.localStorage;
		window.localStorage = {
			getItem: jest.fn(),
			setItem: jest.fn(),
			removeItem: jest.fn(),
		};
	});

	afterEach(() => {
		// Clean up localStorage mock
		delete window.localStorage;
	});

	it('should throw an error if the specified storage is not available', () => {
		// Mock window object without localStorage
		delete window.localStorage;
        console.log(window.localStorage)

		expect(() => {
			renderHook(() => useStorage());
		}).toThrowError('localStorage is not available');
	});

	it('should call localStorage getItem method with the provided key', async () => {
		const key = 'testKey';
		const value = { foo: 'bar' };

		window.localStorage.getItem.mockReturnValueOnce(JSON.stringify(value));

		const { result } = renderHook(() => useStorage());
		const { getItem } = result.current;

		const item = await getItem(key);

		expect(item).toEqual(value);
		expect(window.localStorage.getItem).toHaveBeenCalledWith(key);
	});

	it('should call localStorage setItem method with the provided key and value', async () => {
		const key = 'testKey';
		const value = { foo: 'bar' };

		const { result } = renderHook(() => useStorage());
		const { setItem } = result.current;

		await setItem(key, value);

		expect(window.localStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(value));
	});

	it('should call localStorage removeItem method with the provided key', async () => {
		const key = 'testKey';

		const { result } = renderHook(() => useStorage());
		const { removeItem } = result.current;

		await removeItem(key);

		expect(window.localStorage.removeItem).toHaveBeenCalledWith(key);
	});
});
