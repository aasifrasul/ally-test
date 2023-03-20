import { combineReducers } from 'redux';

import todoReducer from './todoReducer';
import dataFetchReducer from './dataFetchReducer';

const RootReducer = combineReducers({
	todos: todoReducer,
	dataFetchReducer,
});

export default RootReducer;
