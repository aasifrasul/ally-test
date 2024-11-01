import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import InputText from './';

const mockData = {
	value: '',
	onChange: jest.fn(),
	reset: jest.fn(),
	error: '',
	setValue: jest.fn(),
};

jest.mock('../../../hooks/useFormField', () => {
	return jest.fn(() => mockData);
});

const useFormField = require('../../../hooks/Form/useFormField');

jest.mock('../../../hooks/useDebouncedCallback/useDebouncedCallback', () => ({
	useDebouncedCallback: (callback) => callback,
}));

describe('InputText', () => {
	it('renders without crashing', () => {
		const { getByTestId } = render(<InputText id="test-input" />);
		expect(getByTestId('test-input')).toBeInTheDocument();
	});

	it('displays the initial value', () => {
		useFormField.mockImplementation(() => ({
			...mockData,
			value: 'initial value',
		}));

		const { getByTestId } = render(
			<InputText id="test-input" initialValue="initial value" />,
		);
		expect(getByTestId('test-input')).toHaveValue('initial value');
	});

	it('calls onChange when input changes', () => {
		const mockOnChange = jest.fn();
		const { getByTestId } = render(<InputText id="test-input" onChange={mockOnChange} />);
		fireEvent.change(getByTestId('test-input'), { target: { value: 'new value' } });
		expect(mockOnChange).toHaveBeenCalledWith('new value');
	});

	it('displays error message when present', () => {
		useFormField.mockImplementation(() => ({
			...mockData,

			error: 'Error message',
		}));

		const { getByText } = render(<InputText id="test-input" />);
		expect(getByText('Error message')).toBeInTheDocument();
	});

	it('disables input when disabled prop is true', () => {
		const { getByTestId } = render(<InputText id="test-input" disabled={true} />);
		expect(getByTestId('test-input')).toBeDisabled();
	});

	it('updates inputTextRef when value changes', () => {
		const inputTextRef = { current: '' };
		const { getByTestId } = render(
			<InputText id="test-input" inputTextRef={inputTextRef} />,
		);
		fireEvent.change(getByTestId('test-input'), { target: { value: 'new value' } });
		expect(inputTextRef.current).toBe('new value');
	});

	it('updates value when initialValue changes', () => {
		let setValueMock = jest.fn();
		useFormField.mockImplementation(() => ({
			...mockData,
			setValue: setValueMock,
		}));

		const { rerender } = render(<InputText id="test-input" initialValue="initial" />);
		expect(setValueMock).toHaveBeenCalledWith('initial');

		rerender(<InputText id="test-input" initialValue="updated" />);
		expect(setValueMock).toHaveBeenCalledWith('updated');
	});
});
