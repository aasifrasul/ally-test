import { GET_NEWS_FEED } from '../components/NewsFeed/actions';

const initialState = {
	newsFeed: [],
};

interface FeedState {
	newsFeed: any[];
}

interface Action {
	type: string;
	payload?: any;
}

export const feedReducer = (state: FeedState = initialState, action: Action): FeedState => {
	switch (action.type) {
		case GET_NEWS_FEED:
			return { ...state, newsFeed: action.payload };
		default:
			return state;
	}
};
