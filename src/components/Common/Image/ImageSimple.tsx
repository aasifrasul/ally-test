import React from 'react';

import { useImage } from '../../../hooks/useImage';
import { ImageProps } from './types';

/**
 * @component ImageSimple
 * @description A simpler version of Image component without loading overlays.
 * Best for cases where you just want src management without UI overlays.
 *
 * @example
 * <ImageSimple src={currentItem?.logo} alt={currentItem?.name} />
 */
export const ImageSimple: React.FC<ImageProps> = ({
	src,
	alt,
	placeholder,
	useFetch = false,
	loadingClassName = 'loading',
	errorClassName = 'error',
	onError,
	onLoad,
	className = '',
	...imgProps
}) => {
	const {
		src: imageSrc,
		isLoading,
		error,
	} = useImage(src, {
		placeholder,
		useFetch,
		onError,
		onLoad,
	});

	const combinedClassName = [
		className,
		isLoading ? loadingClassName : '',
		error ? errorClassName : '',
	]
		.filter(Boolean)
		.join(' ');

	return <img {...imgProps} src={imageSrc} alt={alt} className={combinedClassName} />;
};
