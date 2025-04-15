import React from 'react';
import { clsx } from 'clsx';

import * as imageStyles from './styles.module.css';

interface ImageProps {
	src: string;
	styles?: string;
	alt: string;
	lazy?: boolean;
	width?: number;
	height?: number;
}

const Image: React.FC<ImageProps> = ({
	src,
	styles,
	alt,
	lazy,
	width = 100,
	height = 100,
}) => {
	const onLoadCallback = (e: React.SyntheticEvent<HTMLImageElement>) => {
		const loader = e.currentTarget?.parentElement?.children[1];
		loader && e.currentTarget?.parentElement?.removeChild(loader);
	};

	const img = lazy ? (
		<img
			data-src={src}
			className={styles}
			height={height}
			width={width}
			alt={alt}
			loading="lazy"
			decoding="async"
			onLoad={onLoadCallback}
		/>
	) : (
		<img src={src} className={styles} height={height} width={width} alt={alt} />
	);

	return (
		<div>
			{img}
			<div className={imageStyles.snippet}>
				<div className={clsx(imageStyles.stage, imageStyles.filterContrast)}>
					<span className={'dot-pulse'}></span>
				</div>
			</div>
		</div>
	);
};

export default Image;
