import { configureStore } from '@reduxjs/toolkit';

import todoReducer from '../reducers/todoReducer';
import feedReducer from '../reducers/feedReducer';

const store = configureStore({
	reducer: {
		todos: todoReducer,
		feedReducer,
	},
});

export default store;

/**
 * 
import { createStore } from 'redux';
import RootReducer from '../reducers/RootReducer';

const store = createStore(RootReducer);

export default store;
*/
