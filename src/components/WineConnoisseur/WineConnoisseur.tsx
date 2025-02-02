import React, { useRef } from 'react';
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
}

const WineConnoisseur: React.FC<WineConnoisseurProps> = ({
	headers,
	pageData,
	fetchNextPage,
	isLoading,
	isError,
	currentPage,
}) => {
	const ioObserverRef = useRef<HTMLDivElement>(null);

	useInfiniteScroll({
		scrollRef: ioObserverRef.current,
		callback: () => fetchNextPage(currentPage + 1),
	});

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
