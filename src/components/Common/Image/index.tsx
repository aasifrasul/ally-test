import React from 'react';

import { useImage } from '../../../hooks/useImage';
import { ImageProps } from './types';

/**
 * @component Image
 * @description A React component for loading images with automatic placeholder,
 * loading states, error handling, and optional retry logic.
 *
 * @example
 * // Simple usage
 * <Image src={imageUrl} alt="Product photo" />
 *
 * @example
 * // With fetch mode and custom placeholder
 * <Image
 *   src={imageUrl}
 *   alt="Product photo"
 *   useFetch={true}
 *   placeholder="/loading.gif"
 *   showRetry={true}
 *   className="w-full h-auto"
 * />
 *
 * @example
 * // With custom error fallback
 * <Image
 *   src={imageUrl}
 *   alt="Product photo"
 *   fallback={<div className="error-state">Image unavailable</div>}
 * />
 */
export const Image: React.FC<ImageProps> = ({
	src,
	alt,
	placeholder,
	useFetch = false,
	loadingClassName = '',
	errorClassName = '',
	fallback,
	showRetry = false,
	onError,
	onLoad,
	className = '',
	...imgProps
}) => {
	const {
		src: imageSrc,
		isLoading,
		error,
		retry,
	} = useImage(src, {
		placeholder,
		useFetch,
		onError,
		onLoad,
	});

	// Determine class names
	const combinedClassName = [
		className,
		isLoading ? loadingClassName : '',
		error ? errorClassName : '',
	]
		.filter(Boolean)
		.join(' ');

	// Show custom fallback on error if provided
	if (error && fallback) return <>{fallback}</>;

	return (
		<div className="relative inline-block">
			<img {...imgProps} src={imageSrc} alt={alt} className={combinedClassName} />

			{/* Optional loading indicator */}
			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
					<div className="text-sm text-gray-600">Loading...</div>
				</div>
			)}

			{/* Optional retry button on error */}
			{error && showRetry && (
				<div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
					<button
						onClick={retry}
						className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
					>
						Retry
					</button>
				</div>
			)}
		</div>
	);
};
