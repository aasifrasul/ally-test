import React from 'react';
import * as ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';

import store from './store';

import App from './components/App/App';

import './index.css';

/*
// ReactDOM.unstable_createRoot(document.querySelector('#root')).render(<App />);
ReactDOM.render(
	<Provider store={store}>
		<App />
	</Provider>,
	document.querySelector('#root')
);
*/

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<Provider store={store}>
			<App />
		</Provider>
	</React.StrictMode>,
);
