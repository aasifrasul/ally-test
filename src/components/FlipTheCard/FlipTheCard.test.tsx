import React from 'react';
import { render, fireEvent, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the component after mocks are set up
import FlipTheCard, { Card } from '.';

// Mock the mock module first
jest.mock('./mock', () => ({
	MOCK: [
		{ name: 'card1', pic: '/card1.png', display: false },
		{ name: 'card1', pic: '/card1.png', display: false },
		{ name: 'card2', pic: '/card2.png', display: false },
		{ name: 'card2', pic: '/card2.png', display: false },
	],
	blankCard: '/blank.png',
}));

// Mock dependencies
jest.mock('../../hooks/useTimer', () => ({
	useTimer: () => ({
		seconds: 10,
		stop: jest.fn(),
		reset: jest.fn(),
	}),
}));

jest.mock('../../utils/typeChecking', () => ({
	safelyExecuteFunction: (fn: Function) => {
		if (fn) fn();
	},
}));

jest.mock('../../utils/ArrayUtils', () => ({
	shuffle: (array: any[]) => array, // Return the array unchanged for predictable tests
}));

// Define test constants
const mockCards: Card[] = [
	{ name: 'card1', pic: '/card1.png', display: false },
	{ name: 'card1', pic: '/card1.png', display: false },
	{ name: 'card2', pic: '/card2.png', display: false },
	{ name: 'card2', pic: '/card2.png', display: false },
];

describe('FlipTheCard Component', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	test('renders the component without errors', () => {
		render(<FlipTheCard />);
		expect(screen.getByTestId('flip-card-game')).toBeInTheDocument();
	});

	test('initial state should have no open cards', () => {
		render(<FlipTheCard mockCards={mockCards} />);
	
		// Check that all cards are closed (showing back side)
		expect(screen.queryAllByTestId(/card-back-/)).toHaveLength(mockCards.length);
		expect(screen.queryAllByTestId(/card-image-/)).toHaveLength(0);
	
		// No cards should have the open class
		expect(screen.queryAllByTestId(/card-\d+/).filter(el => el.classList.contains('card-open'))).toHaveLength(0);
	});

	test('clicking on a card should reveal it', () => {
		render(<FlipTheCard mockCards={mockCards} />);
	
		const cardBack = screen.getByTestId('card-back-0');
		fireEvent.click(cardBack);
	
		// Card should now be open
		expect(screen.queryByTestId('card-image-0')).toBeInTheDocument();
		expect(screen.queryByTestId('card-back-0')).not.toBeInTheDocument();
		expect(screen.getByTestId('card-0')).toHaveClass('card-open');
	});

	test('clicking on two matching cards should keep them open', async () => {
		render(<FlipTheCard mockCards={mockCards} />);
	
		// Click the first card of first pair
		fireEvent.click(screen.getByTestId('card-back-0'));
		// Click the second card of first pair
		fireEvent.click(screen.getByTestId('card-back-1'));
	
		// Both cards should be open
		expect(screen.getByTestId('card-0')).toHaveClass('card-open');
		expect(screen.getByTestId('card-1')).toHaveClass('card-open');
	
		// Wait for state update
		await act(async () => {
			jest.advanceTimersByTime(100);
		});
	
		// Cards should still be open after the timeout
		expect(screen.getByTestId('card-0')).toHaveClass('card-open');
		expect(screen.getByTestId('card-1')).toHaveClass('card-open');
	});

	test('clicking on two non-matching cards should close them after delay', async () => {
		render(<FlipTheCard mockCards={mockCards} />);
	
		// Click the first card of first pair
		fireEvent.click(screen.getByTestId('card-back-0'));
		// Click the first card of second pair
		fireEvent.click(screen.getByTestId('card-back-2'));
	
		// Both cards should be open
		expect(screen.getByTestId('card-0')).toHaveClass('card-open');
		expect(screen.getByTestId('card-2')).toHaveClass('card-open');
	
		// Mock the animation frame
		await act(async () => {
			const rafCallback = jest.requireMock('../../utils/typeChecking').safelyExecuteFunction.mock.calls[0][0];
			rafCallback();
		});
	
		// Advance time to trigger the timeout
		await act(async () => {
			jest.advanceTimersByTime(1100);
		});
	
		// Both cards should be closed again
		expect(screen.queryByTestId('card-image-0')).not.toBeInTheDocument();
		expect(screen.queryByTestId('card-image-2')).not.toBeInTheDocument();
		expect(screen.getByTestId('card-0')).not.toHaveClass('card-open');
		expect(screen.getByTestId('card-2')).not.toHaveClass('card-open');
	});

	test('should not allow clicking more than two cards at once', () => {
		render(<FlipTheCard mockCards={mockCards} />);
	
		// Click first three cards
		fireEvent.click(screen.getByTestId('card-back-0'));
		fireEvent.click(screen.getByTestId('card-back-1'));
		fireEvent.click(screen.getByTestId('card-back-2'));
	
		// Only the first two should be open
		expect(screen.getByTestId('card-0')).toHaveClass('card-open');
		expect(screen.getByTestId('card-1')).toHaveClass('card-open');
		expect(screen.getByTestId('card-2')).not.toHaveClass('card-open');
		expect(screen.queryByTestId('card-image-2')).not.toBeInTheDocument();
	});

	test('restart button should reset the game', async () => {
		render(<FlipTheCard mockCards={mockCards} />);
	
		// Open some cards
		fireEvent.click(screen.getByTestId('card-back-0'));
		fireEvent.click(screen.getByTestId('card-back-1'));
	
		// Wait for state update
		await act(async () => {
			jest.advanceTimersByTime(100);
		});
	
		// Click restart
		fireEvent.click(screen.getByTestId('restart-button'));
	
		// All cards should be closed again
		expect(screen.queryAllByTestId(/card-back-/)).toHaveLength(mockCards.length);
		expect(screen.queryAllByTestId(/card-image-/)).toHaveLength(0);
	});

	test('completing the game should call onGameComplete callback', async () => {
		const mockOnGameComplete = jest.fn();
	
		render(
			<FlipTheCard 
				mockCards={mockCards} 
				onGameComplete={mockOnGameComplete}
			/>
		);
	
		// Complete the game by matching all pairs
		fireEvent.click(screen.getByTestId('card-back-0'));
		fireEvent.click(screen.getByTestId('card-back-1'));
	
		// Wait for state update
		await act(async () => {
			jest.advanceTimersByTime(100);
		});
	
		fireEvent.click(screen.getByTestId('card-back-2'));
		fireEvent.click(screen.getByTestId('card-back-3'));
	
		// Wait for state update
		await act(async () => {
			jest.advanceTimersByTime(100);
		});
	
		// Callback should have been called
		expect(mockOnGameComplete).toHaveBeenCalledTimes(1);
	});

	test('should not allow clicking on already open cards', () => {
		const { rerender } = render(<FlipTheCard mockCards={mockCards} />);
	
		// Helper function to directly set a card's display to true before clicking
		const setCardOpen = (index: number) => {
			const updatedMockCards = [...mockCards];
			updatedMockCards[index].display = true;
			rerender(<FlipTheCard mockCards={updatedMockCards} />);
		};
	
		// Set card 0 as already open
		setCardOpen(0);
	
		// Try to click cards
		fireEvent.click(screen.queryByTestId('card-back-0') || screen.queryByTestId('card-image-0') || document.createElement('div'));
		fireEvent.click(screen.getByTestId('card-back-1'));
		fireEvent.click(screen.getByTestId('card-back-2'));
	
		// Only card 0 (already open) and card 1 (clicked) should be open
		expect(screen.getByTestId('card-0')).toHaveClass('card-open');
		expect(screen.getByTestId('card-1')).toHaveClass('card-open');
		expect(screen.getByTestId('card-2')).not.toHaveClass('card-open');
	});
});