import { render, screen, waitFor } from '@testing-library/react';
import InfiniteScrollContainer from '..';
import { useFetch } from '../../../hooks/useFetch';
import { Schema } from '../../../constants/types';
import type { InitialState } from '../../../constants/types';

jest.mock('../../../hooks/useFetch');

describe('InfiniteScrollContainer', () => {
	// Define mock data
	const mockItems: InitialState['data'] = [
		{ id: 1, name: 'Item 1' },
		{ id: 2, name: 'Item 2' },
	];

	const mockInitialState: InitialState = {
		data: mockItems,
	};

	// Type the mock
	const mockUseFetch = useFetch as jest.MockedFunction<typeof useFetch>;

	const mockFetchData = jest.fn();
	const mockCleanUpTopLevel = jest.fn();
	const mockFetchNextPage = jest.fn();
	const mockGetList = jest.fn();
	const mockUpdateData = jest.fn();

	beforeEach(() => {
		// Reset all mocks
		jest.clearAllMocks();

		// Setup mock implementation
		mockGetList.mockReturnValue(mockInitialState);

		mockUseFetch.mockReturnValue({
			fetchData: mockFetchData,
			fetchNextPage: mockFetchNextPage,
			updateData: mockUpdateData,
		});
	});

	it('should render without crashing and show the infinite scroll component', () => {
		render(<InfiniteScrollContainer />);
		const infiniteScrollElement = screen.getByTestId('infinite-scroll');
		expect(infiniteScrollElement).toBeInTheDocument();
	});

	it('should pass correct props to InfiniteScroll component', () => {
		render(<InfiniteScrollContainer />);

		const infiniteScrollElement = screen.getByTestId('infinite-scroll');

		// Check if all required props are passed
		expect(infiniteScrollElement).toHaveAttribute('data-hasmore', 'true');
		expect(mockGetList).toHaveBeenCalledWith(Schema.INFINITE_SCROLL);
	});

	it('should handle empty data state correctly', () => {
		mockGetList.mockReturnValueOnce({
			data: [],
		});

		render(<InfiniteScrollContainer />);
		const infiniteScrollElement = screen.getByTestId('infinite-scroll');

		expect(infiniteScrollElement).toHaveAttribute('data-hasmore', 'false');
	});

	it('should pass additional props to InfiniteScroll', () => {
		const additionalProps = { className: 'custom-class' };
		render(<InfiniteScrollContainer {...additionalProps} />);

		const infiniteScrollElement = screen.getByTestId('infinite-scroll');
		expect(infiniteScrollElement).toHaveClass('custom-class');
	});

	it('should call useFetch with correct schema', () => {
		render(<InfiniteScrollContainer />);
		expect(mockUseFetch).toHaveBeenCalledWith(Schema.INFINITE_SCROLL);
	});

	describe('error handling', () => {
		it('should handle fetchData errors gracefully', async () => {
			const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
			mockFetchData.mockRejectedValueOnce(new Error('Fetch failed'));

			render(<InfiniteScrollContainer />);

			await waitFor(() => {
				expect(consoleErrorSpy).toHaveBeenCalled();
			});

			consoleErrorSpy.mockRestore();
		});
	});
});
