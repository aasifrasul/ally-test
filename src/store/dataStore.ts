import { create } from 'zustand';
import { APIService } from '../services/APIService';
import { HTTPMethod } from '../types/api';

// Get the singleton instance
const apiService = APIService.getInstance();

// Define your store state interface
interface DataState {
	data: any[];
	isLoading: boolean;
	error: string | null;

	// Actions that trigger side effects
	fetchData: () => Promise<void>;
	createItem: (item: any) => Promise<void>;
	updateItem: (id: string, updates: any) => Promise<void>;
	deleteItem: (id: string) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
	data: [],
	isLoading: false,
	error: null,

	fetchData: async () => {
		try {
			set({ isLoading: true, error: null });
			const data = await apiService.fetch<any[]>('/api/items');
			set({ data, isLoading: false });
		} catch (error) {
			set({ error: (error as Error).message, isLoading: false });
		}
	},

	createItem: async (item) => {
		try {
			set({ isLoading: true, error: null });
			const newItem = await apiService.fetch('/api/items', {
				method: HTTPMethod.POST,
				body: JSON.stringify(item),
			});

			// Update the local state with the new item
			set((state) => ({
				data: [...state.data, newItem],
				isLoading: false,
			}));
		} catch (error) {
			set({ error: (error as Error).message, isLoading: false });
		}
	},

	updateItem: async (id, updates) => {
		try {
			set({ isLoading: true, error: null });
			const updatedItem = await apiService.fetch(`/api/items/${id}`, {
				method: HTTPMethod.PUT,
				body: JSON.stringify(updates),
			});

			// Update the item in the local state
			set((state) => ({
				data: state.data.map((item) => (item.id === id ? updatedItem : item)),
				isLoading: false,
			}));
		} catch (error) {
			set({ error: (error as Error).message, isLoading: false });
		}
	},

	deleteItem: async (id) => {
		try {
			set({ isLoading: true, error: null });
			await apiService.fetch(`/api/items/${id}`, {
				method: HTTPMethod.DELETE,
			});

			// Remove the item from the local state
			set((state) => ({
				data: state.data.filter((item) => item.id !== id),
				isLoading: false,
			}));
		} catch (error) {
			set({ error: (error as Error).message, isLoading: false });
		}
	},
}));
