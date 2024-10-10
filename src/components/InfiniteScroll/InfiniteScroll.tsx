import React, { useState, useEffect, useRef } from 'react';

import useImageLazyLoadIO from '../../hooks/useImageLazyLoadIO';
import ScrollToTop from '../Common/ScrollToTopButton/ScrollToTop';

import { ChildComponentProps } from '../../constants/types';
import { IS_UserData } from '../../types/api';

import UserCard from './UserCard';

import './InfiniteScroll.css';

export const InfiniteScroll = (props: ChildComponentProps) => {
	const data: IS_UserData[] = props.data as IS_UserData[];
	const { currentPage, isLoading, fetchNextPage, TOTAL_PAGES } = props;

	const [observerElement, setObserverElement] = useState(null);

	const observer = useRef<IntersectionObserver | null>(null);

	useEffect(() => {
		observer.current = new IntersectionObserver((entries: IntersectionObserverEntry[]) =>
			entries.forEach(
				(entry) => entry.intersectionRatio > 0 && fetchNextPage(currentPage + 1),
			),
		);
		observerElement && observer.current.observe(observerElement);
		return () => observerElement && observer.current.unobserve(observerElement);
	}, [observerElement]);

	useImageLazyLoadIO('img[data-src]', data?.length as number);

	return (
		<div className={'scrollParent'}>
			{/*<div className={`${topElement} ${uni}`}></div>*/}
			<h1 className="text-3xl text-center mt-4 mb-10">All users</h1>
			<ScrollToTop />
			<div className={'scrollArea'}>
				{data?.map((user, i) => (
					<>
						{Math.floor(data?.length / 1.2) === i ? (
							<div ref={setObserverElement} key={`${user.id.value}-obserbver`}>
								Loading...
							</div>
						) : null}
						<UserCard data={user} key={`${user.id.value}-${i}`} />
					</>
				))}
			</div>
			{isLoading && <p className="text-center">Loading...</p>}
			{currentPage - 1 === TOTAL_PAGES && <p className="text-center my-10">♥</p>}
		</div>
	);
};
