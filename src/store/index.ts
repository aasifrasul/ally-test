import { configureStore } from '@reduxjs/toolkit';
import { todosReducer } from '../components/Todos/reducer';
import feedReducer from '../reducers/feedReducer';

const store = configureStore({
	reducer: {
		todos: todosReducer,
		feed: feedReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

/**
 * 
import { createStore } from 'redux';
import RootReducer from '../reducers/RootReducer';

const store = createStore(RootReducer);

export default store;
*/
