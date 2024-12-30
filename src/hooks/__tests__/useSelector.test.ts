import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from '../useSelector';
import { useFetchStore } from '../../Context/dataFetchContext';
import { GenericState } from '../../Context/types';

// Mock the useFetchStore hook
jest.mock('../../Context/dataFetchContext', () => ({
	useFetchStore: jest.fn(),
}));

type User = {
	id: number;
	name: string;
	email: string;
};

type Post = {
	id: number;
	title: string;
	content: string;
};

type Settings = {
	theme: 'light' | 'dark';
	notifications: boolean;
};

// Define a mock GenericState for testing
interface MockStoreSchema extends GenericState {
	user: {
		data: User[];
	};
	posts: {
		data: Post[];
	};
	settings: {
		data: Settings[];
	};
}

describe('useSelector', () => {
	const mockStore: MockStoreSchema = {
		user: {
			data: [{ id: 1, name: 'John Doe', email: 'john@example.com' }],
		},
		posts: {
			data: [
				{ id: 1, title: 'First Post', content: 'Hello, world!' },
				{ id: 2, title: 'Second Post', content: 'Goodbye, world!' },
			],
		},
		settings: {
			data: [{ theme: 'light', notifications: true }],
		},
	};

	beforeEach(() => {
		(useFetchStore as jest.Mock).mockReset();
		(useFetchStore as jest.Mock).mockReturnValue({ store: mockStore });
	});

	it('should select the entire user object', () => {
		const userSelector = (state: MockStoreSchema) => state.user;
		const { result } = renderHook(() => useSelector(userSelector));
		expect(result.current).toEqual(mockStore.user);
	});

	it('should select a specific user property', () => {
		const nameSelector = (state: MockStoreSchema) => state.user.data[0].name;
		const { result } = renderHook(() => useSelector(nameSelector));
		expect(result.current).toBe('John Doe');
	});

	it('should select the entire posts array', () => {
		const postsSelector = (state: MockStoreSchema) => state.posts;
		const { result } = renderHook(() => useSelector(postsSelector));
		expect(result.current).toEqual(mockStore.posts);
	});

	it('should select a specific post by index', () => {
		const firstPostSelector = (state: MockStoreSchema) => state.posts.data[0];
		const { result } = renderHook(() => useSelector(firstPostSelector));
		expect(result.current).toEqual(mockStore.posts.data[0]);
	});

	it('should handle computed values', () => {
		const postCountSelector = (state: MockStoreSchema) => state.posts.data.length;
		const { result } = renderHook(() => useSelector(postCountSelector));
		expect(result.current).toBe(2);
	});

	it('should handle complex selectors', () => {
		const complexSelector = (state: MockStoreSchema) => ({
			userName: state.user.data[0].name,
			postTitles: state.posts.data.map((post) => post.title),
			isDarkMode: state.settings.data[0].theme === 'dark',
		});
		const { result } = renderHook(() => useSelector(complexSelector));
		expect(result.current).toEqual({
			userName: 'John Doe',
			postTitles: ['First Post', 'Second Post'],
			isDarkMode: false,
		});
	});

	it('should handle selectors that return undefined for non-existent properties', () => {
		const nonExistentSelector = (state: MockStoreSchema) => (state as any).nonExistent;
		const { result } = renderHook(() => useSelector(nonExistentSelector));
		expect(result.current).toBeUndefined();
	});

	it('should throw an error if useFetchStore is not available', () => {
		(useFetchStore as jest.Mock).mockImplementation(() => {
			throw new Error('useFetchStore must be used within a FetchProvider');
		});

		const simpleSelector = (state: MockStoreSchema) => state.user;

		const { result } = renderHook(() => useSelector(simpleSelector));

		expect(result.error).toEqual(
			Error('useFetchStore must be used within a FetchProvider'),
		);
	});

	it('should handle selectors that transform data', () => {
		const transformSelector = (state: MockStoreSchema) => ({
			...state.user,
			data: state.user.data.map((user) => ({
				...user,
				fullName: `${user.name} (${user.email})`,
			})),
		});
		const { result } = renderHook(() => useSelector(transformSelector));
		expect(result.current.data[0]).toEqual({
			id: 1,
			name: 'John Doe',
			email: 'john@example.com',
			fullName: 'John Doe (john@example.com)',
		});
	});

	it('should work with type inference', () => {
		const typedSelector = (state: MockStoreSchema) => state.settings.data[0].theme;
		const { result } = renderHook(() => useSelector(typedSelector));
		expect(result.current).toBe('light');
		// TypeScript should infer that result.current is of type 'light' | 'dark'
	});
});
