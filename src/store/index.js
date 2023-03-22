import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';

import RootReducer from '../reducers/RootReducer';

const composedEnhancer = composeWithDevTools(
	// EXAMPLE: Add whatever middleware you actually want to use here
	// applyMiddleware(print1, print2, print3)
	applyMiddleware(thunk)
	// other store enhancers if any
);

const store = createStore(RootReducer, composedEnhancer);
console.log('Initial state: ', store.getState());
const unsubscribe = store.subscribe(() => console.log('State after dispatch: ', store.getState()));

export default store;
