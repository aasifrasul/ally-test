import { combineReducers } from 'redux';

import todoReducer from './todoReducer';
import dataFetchReducer from './dataFetchReducer';
import feedReducer from './feedReducer';

const RootReducer = combineReducers({
	todos: todoReducer,
	dataFetchReducer,
	feedReducer,
});

export default RootReducer;
