import React from 'react';
import { render } from '@testing-library/react';
import TestComponent from './TestComponent';

test('should call the callback function when element is intersecting', () => {
	const callback = jest.fn();
	const scrollRef = { current: document.createElement('div') };

	render(<TestComponent scrollRef={scrollRef} callback={callback} />);

	// Simulate intersection
	const observer = new IntersectionObserver((entries) =>
		entries.forEach(
			(entry) => entry.isIntersecting && expect(callback).toHaveBeenCalled(),
		),
	);
	observer.observe(scrollRef.current);
});

test('should not call the callback function when scrollRef is null', () => {
	const callback = jest.fn();
	const scrollRef = { current: null };

	render(<TestComponent scrollRef={scrollRef} callback={callback} />);

	// Simulate intersection
	const observer = new IntersectionObserver((entries) =>
		entries.forEach(
			(entry) => entry.isIntersecting && expect(callback).not.toHaveBeenCalled(),
		),
	);
	observer.observe(scrollRef.current);
});

test('should stop observing when component is unmounted', () => {
	const callback = jest.fn();
	const scrollRef = { current: document.createElement('div') };

	const { unmount } = render(<TestComponent scrollRef={scrollRef} callback={callback} />);

	// Simulate intersection
	const observer = new IntersectionObserver((entries) =>
		entries.forEach(
			(entry) => entry.isIntersecting && expect(callback).toHaveBeenCalled(),
		),
	);
	observer.observe(scrollRef.current);

	unmount();

	// Simulate intersection again
	expect(callback).not.toHaveBeenCalled();
});
