export const constants = {
	common: {},
	autoComplete: {
		initialFeed: ['Oranges', 'Apples', 'Banana', 'Kiwi', 'Mango'],
		debounceDelay: 150,
	},
	infiniteScroll: {
		TOTAL_PAGES: 25,
		BASE_URL: `https://randomuser.me/api/`,
		schema: 'infiniteScroll',
		queryParams: {
			page: 1,
			results: 10,
			seed: 'asf',
		},
	},
	movieList: {
		TOTAL_PAGES: 25,
		BASE_URL: `https://api.themoviedb.org/3/discover/movie`,
		schema: 'movieList',
		queryParams: {
			page: 1,
			sort_by: 'popularity.desc',
			api_key: '04c35731a5ee918f014970082a0088b1',
		},
	},
	nestedCategories: {
		url: `https://okrcentral.github.io/sample-okrs/db.json`,
		schema: 'nestedCategories',
	},
	wineConnoisseur: {
		baseURL: `http://localhost:3100/api/fetchWineData/`,
		schema: 'wineConnoisseur',
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
};
