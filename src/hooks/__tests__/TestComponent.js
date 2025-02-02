import React from 'react';
import { useInfiniteScroll } from '../useInfiniteScroll';

const TestComponent = ({ scrollRef, callback }) => {
	useInfiniteScroll({ scrollRef, callback });

	return <div>Test Component</div>;
};

export default TestComponent;
