import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import CombinedRefCheckbox from './CombinedRefCheckbox';

describe('CombinedRefCheckbox', () => {
	const isCheckedRef = { current: '' };
	it('renders without crashing', () => {
		render(<CombinedRefCheckbox isCheckedRef={isCheckedRef} />);
	});

	it('handles checkbox change correctly', () => {
		const isCheckedRef = { current: '' };
		const callback = jest.fn();
		const { getByLabelText } = render(
			<CombinedRefCheckbox
				label="Test"
				name="test"
				value="test"
				callback={callback}
				isCheckedRef={isCheckedRef}
			/>
		);

		const checkbox = getByLabelText('Test');

		// Simulate checkbox change
		fireEvent.click(checkbox);

		// Assert that the callback is called with the correct parameters
		expect(callback).toHaveBeenCalledWith(null, true);

		// Assert that the checked state has been updated
		expect(checkbox.checked).toBe(true);
	});
});
