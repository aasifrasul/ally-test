import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { InfiniteScroll } from '../InfiniteScroll';

// Mock the custom hooks
jest.mock('../../../hooks/useImageLazyLoadIO', () => ({
	__esModule: true,
	default: jest.fn(),
}));

// Mock the ScrollToTop component
jest.mock('../../Common/ScrollToTopButton', () => ({
	__esModule: true,
	default: () => <div data-testid="scroll-to-top">Scroll To Top</div>,
}));

describe('InfiniteScroll', () => {
	const mockFetchNextPage = jest.fn();
	const mockProps = {
		data: [
			{ id: { value: '1' }, name: { first: 'John', last: 'Doe' } },
			{ id: { value: '2' }, name: { first: 'Jane', last: 'Doe' } },
		],
		currentPage: 1,
		isLoading: false,
		fetchNextPage: mockFetchNextPage,
		TOTAL_PAGES: 3,
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('renders the component with initial data', () => {
		render(<InfiniteScroll {...mockProps} />);
		expect(screen.getByText('All users')).toBeInTheDocument();
	});

	test('renders loading state', () => {
		render(<InfiniteScroll {...mockProps} isLoading={true} />);
		expect(screen.getByText('Loading...')).toBeInTheDocument();
	});

	test('renders end of list message when all pages are loaded', () => {
		render(<InfiniteScroll {...mockProps} currentPage={4} />);
		expect(screen.getByText('♥')).toBeInTheDocument();
	});

	test('calls fetchNextPage when intersection observer triggers', async () => {
		const intersectionObserverMock = () => ({
			observe: () => null,
			unobserve: () => null,
			disconnect: () => null,
		});
		window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);

		render(<InfiniteScroll {...mockProps} />);

		// Simulate intersection observer callback
		const callback = (window.IntersectionObserver as jest.Mock).mock.calls[0][0];
		callback([{ intersectionRatio: 1 }]);

		await waitFor(() => {
			expect(mockFetchNextPage).toHaveBeenCalledWith(2);
		});
	});

	test('unmounts without errors', () => {
		const { unmount } = render(<InfiniteScroll {...mockProps} />);
		expect(() => unmount()).not.toThrow();
	});
});
