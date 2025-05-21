import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import FlipTheCard from './index';

test('renders the component without errors', () => {
	render(<FlipTheCard />);
	// Add assertions based on your expected behavior
});

test('initial state should have no open cards and solved cards', () => {
	const { container } = render(<FlipTheCard />);

	// Assert that there are no open cards and solved cards
	expect(container.querySelectorAll('.open').length).toBe(0);
	expect(container.querySelectorAll('.solved').length).toBe(0);
});

test('clicking on a card should open it', () => {
	const { container } = render(<FlipTheCard />);
	const card = container.querySelector('.child');

	// Click on the card
	fireEvent.click(card);

	// Assert that the card is now open
	expect(card.classList).toContain('open');
});
