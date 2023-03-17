import React from 'react';

import cssStyles from './Image.css';

const Image = ({ src, styles, alt, lazy, width = 100, height = 100 }) => {
	const onLoadCallback = (e) => {
		const loader = e.target?.parentElement?.children[1];
		loader && e.target?.parentElement?.removeChild(loader);
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
			<div className="snippet">
				<div className="stage filter-contrast">
					<span className={cssStyles['dot-pulse']}></span>
				</div>
			</div>
		</div>
	);
};

export default Image;
