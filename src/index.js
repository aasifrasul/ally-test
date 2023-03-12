import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import configureStore from './store';

import App from './components/App/App';

import './index.css';

const store = configureStore();
window.store = store;

// ReactDOM.unstable_createRoot(document.querySelector('#root')).render(<App />);
ReactDOM.render(
	<Provider store={store}>
		<App />
	</Provider>,
	document.querySelector('#root'),
);
