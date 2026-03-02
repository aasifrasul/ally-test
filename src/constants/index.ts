import { dataSources } from './dataSources';
import { createImmutable } from '../utils/immutable';
import { BASE_URL, WS_URL } from './base';
import { routes } from './routes';
import { Constants } from './types';
import { FormData } from './FormMetaData';

export const constants = createImmutable<Constants>({
	common: {},
	dataSources,
	routes,
	BASE_URL,
	WS_URL,
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
	FormMetaData: FormData,
});
