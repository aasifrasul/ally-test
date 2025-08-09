import { useLazyImage } from '../../../hooks';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	src: string;
	placeholder?: string;
	rootMargin?: string;
	threshold?: number;
	onLazyLoad?: () => void;
	onLazyError?: (error: Error) => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
	src,
	placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmNGY0ZjQiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlNWU1ZTUiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==',
	rootMargin,
	threshold,
	onLazyLoad,
	onLazyError,
	className = '',
	...props
}) => {
	const imgRef = useLazyImage({
		src,
		placeholder,
		rootMargin,
		threshold,
		onLoad: onLazyLoad,
		onError: onLazyError,
	});

	return (
		<img
			ref={imgRef}
			className={`lazy-image ${className}`}
			alt={props.alt || ''}
			{...props}
		/>
	);
};
