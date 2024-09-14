import nestedCategoriesReducer from '../reducers/nestedCategoriesReducer';
import wineConnoisseurReducer from '../reducers/wineConnoisseurReducer';
import infiniteScrollReducer from '../reducers/infiniteScrollReducer';
import movieListReducer from '../reducers/movieListReducer';

interface QueryParams {
	[key: string]: number | string;
}

interface DataSource {
	TOTAL_PAGES?: number;
	BASE_URL: string;
	schema: string;
	queryParams?: QueryParams;
	timeout: number;
	reducer?: (state: any, action: any) => any;
	headers?: { [key: string]: string };
	options?: any;
	PRODUCT_LIST?: string;
	ADD_ITEM_URL?: string;
	API_KEY?: string;
}

interface DataSources {
	[key: string]: DataSource;
}

export const dataSources: DataSources = {
	infiniteScroll: {
		TOTAL_PAGES: 25,
		BASE_URL: `https://randomuser.me/api`,
		schema: 'infiniteScroll',
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
		schema: 'movieList',
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
		schema: 'nestedCategories',
		timeout: 2000,
		options: {
			method: 'GET',
		},
		reducer: nestedCategoriesReducer,
	},
	wineConnoisseur: {
		BASE_URL: `http://localhost:3100/api/fetchWineData/`,
		schema: 'wineConnoisseur',
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
			schema: 'searchForm',
			timeout: 2000,
			options: {
				method: 'GET',
			},
			headers: {
				'Content-Type': 'application/json',
				api_key: 'Z9Q7WKEY7ORGBUFGN3EG1QS5Y7FG8DU29GHKKSZH',
			},
		};
	})(),
};
