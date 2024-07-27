import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
//import userEvent from '@testing-library/user-event';
import AutoComplete from './AutoComplete';
import { constants } from '../../constants';

AutoComplete.props = {};
AutoComplete.props.suggestions = constants?.autoComplete?.initialFeed;

describe('AutoComplete', () => {
	let getByText;
	beforeEach(() => {
		getByText = render(<AutoComplete />).getByText;
	});

	test('renders AutoComplete component', () => {
		getByText('Search Item:');
	});

	test('displays suggestions on input focus', async () => {
		const { getAllByTestId } = render(<AutoComplete />);
		const input = getAllByTestId('autoCompleteInput')[0];
		fireEvent.focus(input);

		// Assuming suggestions are loaded asynchronously, wait for them to appear
		const suggestionItem = await screen.findByText(constants.autoComplete.initialFeed[0]);
		expect(suggestionItem).toBeInTheDocument();
	});

	test('filters suggestions based on user input', async () => {
		const { getByTestId } = render(<AutoComplete />);

		// Wait for the input to become available
		const input = await waitFor(() => getByTestId('autoCompleteInput'));

		// Now proceed with simulating user input
		userEvent.type(input, 'Kiwi');

		// Check if the filtered suggestion is displayed
		const expectedSuggestion = constants.autoComplete.initialFeed.find((suggestion) =>
			suggestion.includes('Kiwi'),
		);
		expect(await screen.findByText(expectedSuggestion)).toBeInTheDocument();
	});

	test('clears suggestions on input blur', async () => {
		const { queryByTestId } = render(<AutoComplete />);
		const input = queryByTestId('autoCompleteInput');

		if (input) {
			fireEvent.focus(input);

			// Simulate blurring the input
			fireEvent.blur(input);

			// Assuming suggestions are cleared on blur, check if they are no longer visible
			const suggestionItem = screen.queryByText(constants.autoComplete.initialFeed[0]);
			expect(suggestionItem).not.toBeInTheDocument();
		} else {
			throw new Error('Input not found');
		}
	});

	afterEach(() => {
		jest.clearAllMocks();
	});
});
