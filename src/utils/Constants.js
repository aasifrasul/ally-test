import nestedCategoriesReducer from '../reducers/nestedCategoriesReducer.js';
import wineConnoisseurReducer from '../reducers/wineConnoisseurReducer.js';
import infiniteScrollReducer from '../reducers/infiniteScrollReducer.js';
import movieListReducer from '../reducers/movieListReducer.js';

export const constants = Object.freeze({
	common: {},
	autoComplete: {
		initialFeed: ['Oranges', 'Apples', 'Banana', 'Kiwi', 'Mango'],
		debounceDelay: 150,
	},
	dataFetchModules: {
		infiniteScroll: {
			TOTAL_PAGES: 25,
			BASE_URL: `https://randomuser.me/api`,
			schema: 'infiniteScroll',
			queryParams: {
				page: 1,
				results: 10,
				seed: 'FVGW-PN4G-TA7Z-FZBW',
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
				api_key: '41e1d96d45908b49a03a5699ec69bb16',
			},
			reducer: movieListReducer,
		},
		nestedCategories: {
			url: `https://okrcentral.github.io/sample-okrs/db.json`,
			schema: 'nestedCategories',
			reducer: nestedCategoriesReducer,
		},
		wineConnoisseur: {
			baseURL: `http://localhost:3100/api/fetchWineData/`,
			schema: 'wineConnoisseur',
			queryParams: {
				page: 0,
			},
			reducer: wineConnoisseurReducer,
		},
	},
	tictactoe: {
		allPossibleWinningCombo: [
			[`idx-r1-c1`, `idx-r1-c2`, `idx-r1-c3`],
			[`idx-r2-c1`, `idx-r2-c2`, `idx-r2-c3`],
			[`idx-r3-c1`, `idx-r3-c2`, `idx-r3-c3`],
			[`idx-r1-c1`, `idx-r2-c1`, `idx-r3-c1`],
			[`idx-r1-c2`, `idx-r2-c2`, `idx-r3-c2`],
			[`idx-r1-c3`, `idx-r2-c3`, `idx-r3-c3`],
			[`idx-r1-c1`, `idx-r2-c2`, `idx-r3-c3`],
			[`idx-r1-c3`, `idx-r2-c2`, `idx-r3-c1`],
		],
		allowedOptions: ['O', 'X'],
	},
	newsFeed: {
		BASE_URL: 'https://newsapi.org/v2/',
		API_KEY: 'd85ffa9e47de4423af6a356f3f48d0dc',
	},
});
