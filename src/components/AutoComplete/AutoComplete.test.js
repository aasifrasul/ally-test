import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import AutoComplete from './AutoComplete';

// Mock the custom hooks
jest.mock('../../hooks/useDebouncedCallback/useDebouncedCallback', () => ({
	useDebouncedCallback: (callback) => callback,
}));

jest.mock('../../hooks/useOutsideClick', () => ({
	__esModule: true,
	default: () => false,
}));

const mockSuggestions = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];

const renderComponent = () => render(<AutoComplete suggestions={mockSuggestions} />);

describe('AutoComplete component', () => {
	test('renders without crashing', () => {
		const { getByText, getByTestId } = renderComponent();
		expect(getByText('Search Item:')).toBeInTheDocument();
	});

	test('displays suggestions when typing', async () => {
		const { getByText, getByTestId } = renderComponent();
		const input = getByTestId('autoCompleteInput');

		await act(async () => {
			fireEvent.change(input, { target: { value: 'a' } });
		});

		expect(getByText('Apple')).toBeInTheDocument();
		expect(getByText('Banana')).toBeInTheDocument();
	});

	test('displays "No suggestions available" when no matches found', async () => {
		const { getByText, getByTestId } = renderComponent();
		const input = getByTestId('autoCompleteInput');

		await act(async () => {
			fireEvent.change(input, { target: { value: 'z' } });
		});

		expect(getByText('No suggestions available.')).toBeInTheDocument();
	});

	test('updates input value when suggestion is clicked', () => {
		const { getByText, getByRole } = renderComponent();

		const input = getByRole('textbox');

		// Simulate typing into the input
		fireEvent.change(input, { target: { value: 'a' } });
		expect(input.value).toBe('a');

		// Simulate clicking the suggestion
		fireEvent.click(getByText('Apple'));

		// Check that the input value is updated
		expect(input.value).toBe('Apple');
	});

	test('navigates through suggestions with arrow keys', async () => {
		const { getByText, getByTestId } = renderComponent();
		const input = getByTestId('autoCompleteInput');

		await act(async () => {
			fireEvent.change(input, { target: { value: 'a' } });
		});

		fireEvent.keyDown(input, { keyCode: 40 }); // Arrow down
		expect(getByText('Apple')).toHaveClass('suggestion-active');

		fireEvent.keyDown(input, { keyCode: 40 }); // Arrow down
		expect(getByText('Banana')).toHaveClass('suggestion-active');

		fireEvent.keyDown(input, { keyCode: 38 }); // Arrow up
		expect(getByText('Apple')).toHaveClass('suggestion-active');
	});

	test('resets the component when reset button is clicked', async () => {
		const { getByText, getByTestId, queryByText } = renderComponent();
		const input = getByTestId('autoCompleteInput');
		const resetButton = getByText('Reset');

		await act(async () => {
			fireEvent.change(input, { target: { value: 'a' } });
		});

		expect(getByText('Apple')).toBeInTheDocument();

		fireEvent.click(resetButton);

		expect(input.value).toBe('');
		expect(queryByText('Apple')).not.toBeInTheDocument();
	});
});
