import { useLazyImage } from '../../../hooks';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	src: string;
	placeholder?: string;
	rootMargin?: string;
	threshold?: number;
	showLoader?: boolean;
	onLazyLoad?: () => void;
	onLazyError?: (error: Error) => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
	src,
	placeholder,
	rootMargin,
	threshold,
	onLazyLoad,
	onLazyError,
	className = '',
	showLoader = false,
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
		<div className={`lazy-image-container ${className}`}>
			<img ref={imgRef} className="lazy-image" alt={props.alt || ''} {...props} />
		</div>
	);
};
