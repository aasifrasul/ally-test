import { GET_NEWS_FEED } from '../components/NewsFeed/actions';

const initialState = {
	newsFeed: [],
};

const feedReducer = (state = initialState, action) => {
	switch (action.type) {
		case GET_NEWS_FEED:
			return { ...state, newsFeed: action.payload };
		default:
			return state;
	}
};

export default feedReducer;
