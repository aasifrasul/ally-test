import nestedCategoriesReducer from '../reducers/nestedCategoriesReducer.js';
import wineConnoisseurReducer from '../reducers/wineConnoisseurReducer.js';
import infiniteScrollReducer from '../reducers/infiniteScrollReducer.js';
import movieListReducer from '../reducers/movieListReducer.js';

export const dataSources = {
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
		reducer: infiniteScrollReducer,
	},
	movieList: {
		TOTAL_PAGES: 25,
		BASE_URL: `https://api.themoviedb.org/3/discover/movie`,
		schema: 'movieList',
		queryParams: {
			page: 1,
			sort_by: 'popularity.desc',
			api_key: '41e1d96d45908b49a03a5699ec69bb16',
		},
		timeout: 5000,
		reducer: movieListReducer,
	},
	nestedCategories: {
		BASE_URL: `https://okrcentral.github.io/sample-okrs/db.json`,
		schema: 'nestedCategories',
		timeout: 2000,
		reducer: nestedCategoriesReducer,
	},
	wineConnoisseur: {
		BASE_URL: `http://localhost:3100/api/fetchWineData/`,
		schema: 'wineConnoisseur',
		queryParams: {
			page: 0,
		},
		timeout: 2000,
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
			headers: {
				'Content-Type': 'application/json',
				api_key: 'Z9Q7WKEY7ORGBUFGN3EG1QS5Y7FG8DU29GHKKSZH',
			},
		};
	})(),
};
