import React, { useState, useCallback } from 'react';

import { MovieProps } from '../../types/movieList';

import Portal from '../Common/Portal/Portal';
import Image from '../Common/Image';

export const Movie: React.FC<MovieProps> = ({ styles, item }) => {
	const [isShown, setIsShown] = useState(false);
	const { id, poster_path, title, vote_average, overview } = item;
	const imagePath = poster_path
		? `https://image.tmdb.org/t/p/w1280${poster_path}`
		: '/placeholder-movie.jpg'; // Add a placeholder image

	const handleMouseOver = useCallback(() => setIsShown(true), []);
	const handleMouseOut = useCallback(() => setIsShown(false), []);

	return (
		<>
			<div
				className={styles.imageWrapper}
				key={id}
				onMouseEnter={handleMouseOver}
				onMouseLeave={handleMouseOut}
			>
				<div className={styles.image}>
					<Image src={imagePath} width={150} height={200} alt={title} />
				</div>
				<div className={styles.movieInfo}>
					<h3 className={styles.title}>{title}</h3>
					<span className={styles.rating}>Rating: {vote_average.toFixed(1)}</span>
				</div>
				{isShown && (
					<Portal
						container={document.querySelector(`.${styles.mouseOverWrapper}_${id}`)}
					>
						<div className={styles.overview}>{overview}</div>
					</Portal>
				)}
			</div>
			<div className={`${styles.mouseOverWrapper}_${id}`} />
		</>
	);
};
