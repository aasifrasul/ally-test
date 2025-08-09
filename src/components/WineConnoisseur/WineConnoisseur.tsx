import { useRef, FC, RefObject } from 'react';
import DataGrid from '../Common/DataGrid/DataGrid';
import ScrollToTop from '../Common/ScrollToTopButton';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import * as styles from './WineConnoisseur.module.css';

interface WineConnoisseurProps {
	headers: any[];
	pageData: any[];
	fetchNextPage: (page: number) => void;
	isLoading: boolean;
	isError: boolean;
	currentPage: number;
	hasNextPage?: boolean; // Add this prop
	totalPages?: number; // Optional: for better UX
}

const WineConnoisseur: FC<WineConnoisseurProps> = ({
	headers,
	pageData,
	fetchNextPage,
	isLoading,
	isError,
	currentPage,
	hasNextPage = true,
	totalPages,
}) => {
	const ioObserverRef = useRef<HTMLDivElement>(null);

	useInfiniteScroll({
		scrollRef: ioObserverRef,
		callback: () => fetchNextPage(currentPage + 1),
		isLoading,
		hasNextPage,
	});

	if (isLoading && pageData.length === 0) {
		return <div>Loading...</div>;
	}

	if (isError) {
		return <div>Encountered some error, Please refresh the page</div>;
	}

	if (pageData.length === 0) {
		return <div>No Items found</div>;
	}

	return (
		<div className={styles.alignCenter}>
			<span>Wine Connoisseur</span>
			<ScrollToTop />
			<DataGrid headings={headers} rows={pageData} />

			{/* Conditional rendering of observer/loading indicator */}
			{hasNextPage && (
				<div ref={ioObserverRef} style={{ height: '20px', margin: '20px 0' }}>
					{isLoading ? 'Loading more...' : ''}
				</div>
			)}

			{/* Optional: Show completion message */}
			{!hasNextPage && pageData.length > 0 && (
				<div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
					{totalPages ? `Showing all ${totalPages} pages` : 'No more items to load'}
				</div>
			)}
		</div>
	);
};

export default WineConnoisseur;
