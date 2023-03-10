const toRect = (rect) => {
	const { width = 0, height = 0, x = 0, y = 0 } = rect || {};
	return { width, height, x, y };
};

const useResizeObserver = (ref) => {
	const setRectData = () => toRect(ref.current?.getBoundingClientRect());
	const [rect, setRect] = useState(setRectData());

	useeffect(() => {
		const ob = new ResizeObserver(() => setRect(setRectData()));

		ob.observe(ref.current);

		return () => ob.disconnet();
	}, [ref]);

	return rect;
};

export default useResizeObserver;
