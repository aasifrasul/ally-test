import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import axios from 'axios';
const BASE_URL = '/api/news/';

export const apiClient = axios.create({
	baseURL: BASE_URL,
	timeout: 10000,
	headers: {
		'X-Api-key': 'd85ffa9e47de4423af6a356f3f48d0dc',
	},
});

export const api = createApi({
	baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
	endpoints: (builder) => ({
		getNewsFeed: builder.query({
			query: ({ language, category }: { language: string; category: string }) =>
				`top-headlines?language=${language}&category=${category}`,
		}),
	}),
});
