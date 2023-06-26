import React from 'react';
import { render } from '@testing-library/react';
import useInfiniteScrollIO from '.';

const TestComponent = ({ scrollRef, callback }) => {
	useInfiniteScrollIO(scrollRef, callback);

	return <div>Test Component</div>;
};

export default TestComponent;
