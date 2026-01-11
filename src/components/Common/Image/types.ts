import React, { ImgHTMLAttributes } from 'react';

/**
 * @interface ImageProps
 * @description Props for the Image component.
 */
export interface ImageProps
	extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError' | 'onLoad'> {
	/**
	 * @property {string | undefined | null} src - The image URL to load.
	 */
	src: string | undefined | null;
	/**
	 * @property {string} alt - Alt text for the image (required for accessibility).
	 */
	alt: string;
	/**
	 * @property {string} [placeholder] - Placeholder image URL.
	 */
	placeholder?: string;
	/**
	 * @property {boolean} [useFetch] - Use fetch mode with retry/caching. Defaults to false.
	 */
	useFetch?: boolean;
	/**
	 * @property {string} [loadingClassName] - Additional class name when loading.
	 */
	loadingClassName?: string;
	/**
	 * @property {string} [errorClassName] - Additional class name on error.
	 */
	errorClassName?: string;
	/**
	 * @property {React.ReactNode} [fallback] - Custom fallback content on error.
	 */
	fallback?: React.ReactNode;
	/**
	 * @property {boolean} [showRetry] - Show retry button on error. Defaults to false.
	 */
	showRetry?: boolean;
	/**
	 * @property {((error: Error) => void)} [onError] - Error callback.
	 */
	onError?: (error: Error) => void;
	/**
	 * @property {(() => void)} [onLoad] - Success callback.
	 */
	onLoad?: () => void;
}
