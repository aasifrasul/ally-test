import { render, screen, waitFor } from '@testing-library/react';
import InfiniteScrollContainer from '..';
import { useSchemaQuery } from '../../../hooks/dataSelector';
import { Schema } from '../../../constants/types';
import type { InitialState } from '../../../constants/types';
import { mockUserData } from '../../../reducers/__tests__/infiniteScroll.testdata';

jest.mock('../../../hooks/dataSelector');

describe('InfiniteScrollContainer', () => {
	beforeAll(() => {
		class ResizeObserverMock {
			observe = jest.fn();
			unobserve = jest.fn();
			disconnect = jest.fn();
		}
		(global as any).ResizeObserver = ResizeObserverMock;
	});

	const mockItems: InitialState['data'] = mockUserData;

	const mockInitialState: InitialState = {
		data: mockItems,
	};

	const mockUseSchemaQuery = useSchemaQuery as jest.MockedFunction<typeof useSchemaQuery>;

	const mockFetchData = jest.fn();
	const mockFetchNextPage = jest.fn();
	const mockUpdateData = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();

		mockUseSchemaQuery.mockReturnValue({
			schema: Schema.INFINITE_SCROLL,
			data: mockInitialState.data,
			pageData: [],
			headers: [],
			isLoading: false,
			currentPage: 1,
			isError: false,
			fetchData: mockFetchData,
			fetchNextPage: mockFetchNextPage,
			updateData: mockUpdateData,
		});
	});

	it('should render without crashing and show the infinite scroll component', () => {
		render(<InfiniteScrollContainer />);
		const infiniteScrollElement = screen.getByTestId('infinite-scroll');
		expect(infiniteScrollElement).not.toBeNull();
	});

	it('should pass correct props to InfiniteScroll component', () => {
		render(<InfiniteScrollContainer />);

		const infiniteScrollElement = screen.getByTestId('infinite-scroll');

		expect(infiniteScrollElement.getAttribute('data-hasmore')).toBe('true');
		expect(mockUseSchemaQuery).toHaveBeenCalledWith(Schema.INFINITE_SCROLL);
	});

	it('should handle empty data state correctly', () => {
		mockUseSchemaQuery.mockReturnValueOnce({
			schema: Schema.INFINITE_SCROLL,
			data: [],
			pageData: [],
			headers: [],
			isLoading: false,
			currentPage: 1,
			isError: false,
			fetchData: mockFetchData,
			fetchNextPage: mockFetchNextPage,
			updateData: mockUpdateData,
		});

		render(<InfiniteScrollContainer />);
		expect(screen.getByText('No Records found')).not.toBeNull();
	});

	it('should unwrap RandomUser-style results payloads before rendering', () => {
		mockUseSchemaQuery.mockReturnValueOnce({
			schema: Schema.INFINITE_SCROLL,
			data: { results: [mockItems[0]], info: { count: 1 } },
			pageData: [],
			headers: [],
			isLoading: false,
			currentPage: 1,
			isError: false,
			fetchData: mockFetchData,
			fetchNextPage: mockFetchNextPage,
			updateData: mockUpdateData,
		});

		render(<InfiniteScrollContainer />);

		expect(screen.queryByText('No Records found')).toBeNull();
		expect(screen.getByTestId('infinite-scroll')).not.toBeNull();
	});

	it('should pass additional props to InfiniteScroll', () => {
		const additionalProps = { className: 'custom-class' };
		render(<InfiniteScrollContainer {...additionalProps} />);

		const infiniteScrollElement = screen.getByTestId('infinite-scroll');
		expect(infiniteScrollElement.classList.contains('custom-class')).toBe(true);
	});

	it('should call useSchemaQuery with correct schema', () => {
		render(<InfiniteScrollContainer />);
		expect(mockUseSchemaQuery).toHaveBeenCalledWith(Schema.INFINITE_SCROLL);
	});
});
