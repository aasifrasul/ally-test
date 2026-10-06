import { useRef, FC } from 'react';
import DataGrid from '../Common/DataGrid/DataGrid';
import ScrollToTop from '../Common/ScrollToTopButton';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import styles from './WineConnoisseur.module.css';

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
	const sentinelRef = useRef<HTMLDivElement>(null);

	useInfiniteScroll({
		sentinelRef,
		callback: () => fetchNextPage(currentPage + 1),
		enabled: true,
		isLoading,
		hasNextPage,
	});

	return (
		<div className={styles.alignCenter}>
			<span>Wine Connoisseur</span>
			<ScrollToTop />

			{/* Show appropriate states but always keep the DataGrid and sentinel
			   in the DOM so the IntersectionObserver can attach on first mount. */}
			{isError && <div>Encountered some error, Please refresh the page</div>}

			{isLoading && pageData.length === 0 ? (
				<div>Loading...</div>
			) : pageData.length === 0 ? (
				<div>No Items found</div>
			) : (
				<DataGrid headings={headers} rows={pageData} />
			)}

			{/* Sentinel for intersection observer — always rendered */}
			<div ref={sentinelRef} style={{ height: '20px', margin: '20px 0' }}>
				{isLoading && pageData.length > 0 ? 'Loading more...' : ''}
			</div>

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
