import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import InputText from '.';

describe('InputText', () => {
	it('renders without errors', () => {
        const inputTextRef = { current: '' };
		render(<InputText label="Test" name="test" inputTextRef={inputTextRef} />);
		// No error should occur during rendering
	});

    it('sets initial value correctly', () => {
		const inputTextRef = { current: 'initial value' };
		const { getByLabelText } = render(
			<InputText label="Test" name="test" inputTextRef={inputTextRef} />
		);

		const inputElement = getByLabelText('Test');
		expect(inputElement.value).toBe('initial value');
	});

	it('updates the value on input change', () => {
		const inputTextRef = { current: '' };
		const { getByLabelText } = render(
			<InputText label="Test" name="test" inputTextRef={inputTextRef} />
		);

		const inputElement = getByLabelText('Test');
		fireEvent.change(inputElement, { target: { value: 'new value' } });

		expect(inputElement.value).toBe('new value');
		expect(inputTextRef.current).toBe('new value');
	});

	it('calls onChangeCallback function when input value changes', () => {
        const inputTextRef = { current: '' };
		const onChangeCallback = jest.fn();
		const { getByLabelText } = render(
			<InputText label="Test" name="test" onChangeCallback={onChangeCallback} inputTextRef={inputTextRef} />
		);

		const inputElement = getByLabelText('Test');
		fireEvent.change(inputElement, { target: { value: 'new value' } });

		expect(onChangeCallback).toHaveBeenCalledTimes(1);
		expect(onChangeCallback).toHaveBeenCalledWith('new value');
	});

	it('calls onKeyDown function when a key is pressed', () => {
        const inputTextRef = { current: '' };
		const onKeyDown = jest.fn();
		const { getByLabelText } = render(
			<InputText label="Test" name="test" onKeyDown={onKeyDown} inputTextRef={inputTextRef} />
		);

		const inputElement = getByLabelText('Test');
		fireEvent.keyDown(inputElement, { key: 'Enter', keyCode: 13 });

		expect(onKeyDown).toHaveBeenCalledTimes(1);
		expect(onKeyDown).toHaveBeenCalledWith(expect.anything());
	});
});
