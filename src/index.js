import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import store from './store';

import App from './components/App/App';

import './index.css';

// ReactDOM.unstable_createRoot(document.querySelector('#root')).render(<App />);
ReactDOM.render(
	<Provider store={store}>
		<App />
	</Provider>,
	document.querySelector('#root'),
);
