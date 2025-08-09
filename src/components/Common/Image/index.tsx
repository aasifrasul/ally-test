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
	const [isLoaded, setIsLoaded] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const handleLoad = () => {
		setIsLoaded(true);
		setIsLoading(false);
	};

	return (
		<div className={styles}>
			<img
				src={src}
				alt={alt}
				width={width}
				height={height}
				loading={lazy ? 'lazy' : 'eager'}
				onLoad={handleLoad}
				style={{ display: isLoaded ? 'block' : 'none' }}
			/>
			{isLoading && (
				<div className={imageStyles.snippet}>
					<div className={clsx(imageStyles.stage, imageStyles.filterContrast)}>
						<span className="dot-pulse" />
					</div>
				</div>
			)}
		</div>
	);
};

export default Image;
