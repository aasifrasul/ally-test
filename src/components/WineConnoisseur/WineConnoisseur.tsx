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
}

const WineConnoisseur: FC<WineConnoisseurProps> = ({
	headers,
	pageData,
	fetchNextPage,
	isLoading,
	isError,
	currentPage,
}) => {
	const ioObserverRef = useRef<HTMLDivElement>(null);

	useInfiniteScroll({
		scrollRef: ioObserverRef,
		callback: () => fetchNextPage(currentPage + 1),
	});

	if (isLoading) {
		return <div>Loading...</div>
	}

	if (isError) {
		return <div>Encountered some error, Please refresh the page</div>
	}

	if (pageData.length === 0) {
		return <div>No Items found</div>
	}

	return (
		<div className={styles.alignCenter}>
			<span>Wine Connoisseur</span>
			<ScrollToTop />
			<DataGrid headings={headers} rows={pageData} />
			<div ref={ioObserverRef}>Loading...</div>
		</div>
	);
};

export default WineConnoisseur;
