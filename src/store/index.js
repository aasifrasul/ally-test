import { configureStore } from '@reduxjs/toolkit';

import todoReducer from '../reducers/todoReducer';
import dataFetchReducer from '../reducers/dataFetchReducer';
import feedReducer from '../reducers/feedReducer';

const store = configureStore({
	reducer: {
		todos: todoReducer,
		dataFetchReducer,
		feedReducer,
	},
});

export default store;
