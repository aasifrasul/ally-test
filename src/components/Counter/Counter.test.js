import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import Counter from './Counter';

const mockStore = configureStore([]);

describe('Counter component', () => {
	let store;
	let component;
	let counterText;

	beforeEach(() => {
		store = mockStore({
			counter: 0,
		});
		component = render(
			<Provider store={store}>
				<Counter />
			</Provider>
		);
		counterText = component.getByText(/Counter:/);
	});

	it('renders the current counter value', () => {
		expect(counterText).toHaveTextContent('Counter: 0');
	});

	it('increments the counter value when the "+" button is clicked', () => {
		const incrementButton = component.getByText('+');
		fireEvent.click(incrementButton);
		expect(counterText).toHaveTextContent('Counter: 1');
	});

	it('decrements the counter value when the "-" button is clicked', () => {
		const decrementButton = component.getByText('-');
		fireEvent.click(decrementButton);
		expect(counterText).toHaveTextContent('Counter: 0');
	});

	afterEach(() => {
		store.clearActions(); // Reset dispatched actions
	});
});
