import { create } from 'zustand';
import { APIService } from '../services/APIService';
import { HTTPMethod } from '../types/api';

const apiService = APIService.getInstance();

interface ResourceConfig {
	baseURL: string;
	endpoints: {
		list: string;
		create: string;
		update: (id: string) => string;
		delete: (id: string) => string;
	};
	defaultHeaders?: Record<string, any>;
}

interface ResourceState<T = any> {
	data: T[];
	isLoading: boolean;
	error: string | null;

	// CRUD operations
	fetchData: (additionalHeaders?: Record<string, any>) => Promise<void>;
	createItem: (item: Partial<T>, additionalHeaders?: Record<string, any>) => Promise<void>;
	updateItem: (
		id: string,
		updates: Partial<T>,
		additionalHeaders?: Record<string, any>,
	) => Promise<void>;
	deleteItem: (id: string, additionalHeaders?: Record<string, any>) => Promise<void>;

	// Utility methods
	clearError: () => void;
	reset: () => void;
}

export function createResourceStore<T = any>(config: ResourceConfig) {
	return create<ResourceState<T>>((set, get) => ({
		data: [],
		isLoading: false,
		error: null,

		fetchData: async (additionalHeaders = {}) => {
			const headers = { ...config.defaultHeaders, ...additionalHeaders };

			set({ isLoading: true, error: null });
			const result = await apiService.fetch<T[]>(config.endpoints.list, headers);

			if (result.success) {
				set({ data: result.data, isLoading: false });
			} else {
				set({ error: (result.error as Error).message, isLoading: false });
			}
		},

		createItem: async (item, additionalHeaders = {}) => {
			const headers = {
				'Content-Type': 'application/json',
				...config.defaultHeaders,
				...additionalHeaders,
			};

			set({ isLoading: true, error: null });
			const result = await apiService.fetch<T>(config.endpoints.create, {
				...headers,
				method: HTTPMethod.POST,
				body: JSON.stringify(item),
			});

			if (result.success) {
				set((state) => ({
					data: [...state.data, ...result.data],
					isLoading: false,
				}));
			} else {
				set({ error: (result.error as Error).message, isLoading: false });
			}
		},

		updateItem: async (id, updates, additionalHeaders = {}) => {
			const headers = {
				'Content-Type': 'application/json',
				...config.defaultHeaders,
				...additionalHeaders,
			};

			set({ isLoading: true, error: null });
			const result = await apiService.fetch<T>(config.endpoints.update(id), {
				...headers,
				method: HTTPMethod.PUT,
				body: JSON.stringify(updates),
			});

			if (result.success) {
				set((state) => ({
					data: state.data.map((item: any) => (item.id === id ? result.data : item)),
					isLoading: false,
				}));
			} else {
				set({ error: (result.error as Error).message, isLoading: false });
			}
		},

		deleteItem: async (id, additionalHeaders = {}) => {
			const headers = { ...config.defaultHeaders, ...additionalHeaders };

			set({ isLoading: true, error: null });
			const result = await apiService.fetch(config.endpoints.delete(id), {
				...headers,
				method: HTTPMethod.DELETE,
			});

			if (result.success) {
				set((state) => ({
					data: state.data.filter((item: any) => item.id !== id),
					isLoading: false,
				}));
			} else {
				set({ error: (result.error as Error).message, isLoading: false });
			}
		},

		clearError: () => set({ error: null }),

		reset: () => set({ data: [], isLoading: false, error: null }),
	}));
}

// Usage examples:
export const useUsersStore = createResourceStore({
	baseURL: '/api',
	endpoints: {
		list: '/api/users',
		create: '/api/users',
		update: (id) => `/api/users/${id}`,
		delete: (id) => `/api/users/${id}`,
	},
	defaultHeaders: {
		Authorization: 'Bearer token',
	},
});

export const useProductsStore = createResourceStore({
	baseURL: '/api',
	endpoints: {
		list: '/api/products',
		create: '/api/products',
		update: (id) => `/api/products/${id}`,
		delete: (id) => `/api/products/${id}`,
	},
	defaultHeaders: {
		Authorization: 'Bearer token',
		'X-Client-Version': '1.0.0',
	},
});
