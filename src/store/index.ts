import { configureStore } from '@reduxjs/toolkit';
import { todosReducer } from '../components/Todos/reducer';
import { feedReducer } from '../reducers/feedReducer';
import { contactReducer } from '../components/Contacts/contactReducer';
import { api } from '../components/NewsFeed/apiClient';

const store = configureStore({
	reducer: {
		todos: todosReducer,
		feed: feedReducer,
		contacts: contactReducer,
		[api.reducerPath]: api.reducer,
	},
	// Adding the api middleware enables caching, invalidation, polling,
	// and other useful features of RTK Query.
	middleware: (getDefaultMiddleware: any) => getDefaultMiddleware().concat(api.middleware),
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
