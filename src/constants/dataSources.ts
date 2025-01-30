import nestedCategoriesReducer from '../reducers/nestedCategoriesReducer';
import wineConnoisseurReducer from '../reducers/wineConnoisseurReducer';
import infiniteScrollReducer from '../reducers/infiniteScrollReducer';
import movieListReducer from '../reducers/movieListReducer';

import { DataSources, Schema, InitialState, Action } from './types';

export const dataSources: DataSources = {
	infiniteScroll: {
		TOTAL_PAGES: 25,
		BASE_URL: `https://randomuser.me/api`,
		schema: Schema.INFINITE_SCROLL,
		queryParams: {
			page: 1,
			results: 10,
			seed: 'FVGW-PN4G-TA7Z-FZBW',
		},
		timeout: 2000,
		options: {
			method: 'GET',
		},
		reducer: infiniteScrollReducer,
	},
	movieList: {
		TOTAL_PAGES: 25,
		BASE_URL: `https://api.themoviedb.org/3/discover/movie`,
		schema: Schema.MOVIE_LIST,
		queryParams: {
			page: 1,
			sort_by: 'popularity.desc',
			api_key: '0cdc4ae2e7e4bf7c2605a838320c2bf9',
		},
		options: {
			method: 'GET',
		},
		timeout: 5000,
		reducer: movieListReducer,
	},
	nestedCategories: {
		BASE_URL: `https://localhost:3100/proxy/okrcentral`,
		schema: Schema.NESTED_CATEGORIES,
		timeout: 2000,
		options: {
			method: 'GET',
		},
		reducer: nestedCategoriesReducer,
	},
	wineConnoisseur: {
		BASE_URL: `http://localhost:3100/api/fetchWineData/`,
		schema: Schema.WINE_CONNOISSUER,
		queryParams: {
			page: 0,
		},
		timeout: 2000,
		options: {
			method: 'GET',
		},
		reducer: wineConnoisseurReducer,
	},
	searchForm: (() => {
		const BASE_URL = 'https://lobster-app-ddwng.ondigitalocean.app/product/';
		return {
			BASE_URL,
			PRODUCT_LIST: `${BASE_URL}list`,
			ADD_ITEM_URL: `${BASE_URL}add_new`,
			API_KEY: 'Z9Q7WKEY7ORGBUFGN3EG1QS5Y7FG8DU29GHKKSZH',
			schema: Schema.SEARCH_FORM,
			timeout: 2000,
			options: {
				method: 'GET',
			},
			headers: {
				'Content-Type': 'application/json',
				api_key: 'Z9Q7WKEY7ORGBUFGN3EG1QS5Y7FG8DU29GHKKSZH',
			},
			reducer: (state: InitialState, action: Action): InitialState => state,
		};
	})(),
};
