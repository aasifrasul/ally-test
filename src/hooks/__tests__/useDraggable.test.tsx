import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { useDraggable } from '../useDraggable';
import { renderHook, act } from '@testing-library/react-hooks';

// Mock component using the useDraggable hook
const TestComponent: React.FC<{ onMove: (position: [number, number]) => void }> = ({
	onMove,
}) => {
	const [ref, onMouseDown] = useDraggable(onMove);
	return (
		<div
			data-testid="draggable"
			ref={ref as React.RefObject<HTMLDivElement>}
			onMouseDown={onMouseDown}
		>
			Drag me
		</div>
	);
};

describe('useDraggable', () => {
	it('should initialize without errors', () => {
		const onMove = jest.fn();
		render(<TestComponent onMove={onMove} />);
		expect(screen.getByTestId('draggable')).toBeInTheDocument();
	});

	it('should call onMove when dragging', () => {
		const onMove = jest.fn();
		render(<TestComponent onMove={onMove} />);
		const element = screen.getByTestId('draggable');

		// Simulate mouse down
		fireEvent.mouseDown(element, { clientX: 0, clientY: 0 });

		// Simulate mouse move
		fireEvent.mouseMove(document, { clientX: 100, clientY: 100 });

		expect(onMove).toHaveBeenCalledWith([100, 100]);
	});

	it('should stop calling onMove after mouse up', () => {
		const onMove = jest.fn();
		render(<TestComponent onMove={onMove} />);
		const element = screen.getByTestId('draggable');

		// Simulate mouse down
		fireEvent.mouseDown(element, { clientX: 0, clientY: 0 });

		// Simulate mouse move
		fireEvent.mouseMove(document, { clientX: 100, clientY: 100 });

		// Simulate mouse up
		fireEvent.mouseUp(document);

		// Simulate another mouse move
		fireEvent.mouseMove(document, { clientX: 200, clientY: 200 });

		expect(onMove).toHaveBeenCalledTimes(1);
		expect(onMove).toHaveBeenCalledWith([100, 100]);
	});

	it('should update ref and return mouseDown handler', () => {
		const onMove = jest.fn();
		const { result } = renderHook(() => useDraggable(onMove));

		const [ref, onMouseDown] = result.current;

		expect(ref).toBeDefined();
		expect(typeof onMouseDown).toBe('function');
	});
});
