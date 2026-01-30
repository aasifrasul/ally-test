import { useState, useEffect, useRef } from 'react';

import ScrollToTop from '../Common/ScrollToTopButton';

import { InitialState } from '../../constants/types';
import { ISProps } from '../../types/infiniteScroll';

import UserCard from './UserCard';

import './InfiniteScroll.css';

type Props = Omit<InitialState, 'data'> & ISProps;

export const InfiniteScroll = (props: Props) => {
	const { currentPage = 1, fetchNextPage, TOTAL_PAGES, data } = props;

	const [observerElement, setObserverElement] = useState<HTMLDivElement | null>(null);

	const observer = useRef<IntersectionObserver | null>(null);

	useEffect(() => {
		observer.current = new IntersectionObserver((entries: IntersectionObserverEntry[]) =>
			entries.forEach(
				(entry) => entry.intersectionRatio > 0 && fetchNextPage(currentPage + 1),
			),
		);
		observerElement && observer.current?.observe(observerElement);
		return () => {
			observerElement && observer.current?.unobserve(observerElement);
		};
	}, [observerElement]);

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
						<UserCard
							data={user}
							key={`${user.id.value}-${i}`}
							data-testid="user-details"
						/>
					</>
				))}
			</div>
			{currentPage - 1 === TOTAL_PAGES && <p className="text-center my-10">♥</p>}
		</div>
	);
};
