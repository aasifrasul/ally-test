import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import AutoComplete from '.';
import styles from './styles.module.css';

jest.mock('../../hooks/useOutsideClick', () => ({
	__esModule: true,
	default: () => [false],
}));

const mockSuggestions = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];

const renderComponent = () => render(<AutoComplete suggestions={mockSuggestions} />);

describe('AutoComplete component', () => {
	test('renders without crashing', () => {
		renderComponent();
		expect(screen.getByText('Search Item:')).toBeInTheDocument();
	});

	test('displays suggestions when typing', async () => {
		renderComponent();
		const input = screen.getByRole('textbox');

		await act(async () => {
			fireEvent.change(input, { target: { value: 'a' } });
		});

		expect(screen.getByText('Apple')).toBeInTheDocument();
		expect(screen.getByText('Banana')).toBeInTheDocument();
	});

	test('displays no suggestions when no matches found', async () => {
		renderComponent();
		const input = screen.getByRole('textbox');

		await act(async () => {
			fireEvent.change(input, { target: { value: 'z' } });
		});

		const suggestions = screen.queryByRole('listbox');
		expect(suggestions).toBeNull();
	});

	test('updates input value when suggestion is clicked', async () => {
		renderComponent();
		const input = screen.getByRole('textbox');

		// Simulate typing into the input
		await act(async () => {
			fireEvent.change(input, { target: { value: 'a' } });
		});

		// Simulate clicking the suggestion
		const appleOption = screen.getByText('Apple');
		fireEvent.click(appleOption);

		// Check that the input value is updated
		expect(input).toHaveValue('Apple');
	});

	test('navigates through suggestions with arrow keys', async () => {
		renderComponent();
		const input = screen.getByRole('textbox');

		await act(async () => {
			fireEvent.change(input, { target: { value: 'a' } });
		});

		fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' }); // Arrow down
		const appleOption = screen.getByText('Apple');
		expect(appleOption).toHaveClass(styles['suggestion-active']);

		fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' }); // Arrow down
		const bananaOption = screen.getByText('Banana');
		expect(bananaOption).toHaveClass(styles['suggestion-active']);

		fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' }); // Arrow up
		expect(appleOption).toHaveClass(styles['suggestion-active']);
	});

	test('resets the component when reset button is clicked', async () => {
		renderComponent();
		const input = screen.getByRole('textbox');
		const resetButton = screen.getByText('Reset');

		await act(async () => {
			fireEvent.change(input, { target: { value: 'a' } });
		});

		expect(screen.getByText('Apple')).toBeInTheDocument();

		fireEvent.click(resetButton);

		expect(input).toHaveValue('');
		expect(screen.queryByRole('listbox')).toBeNull();
	});
});
