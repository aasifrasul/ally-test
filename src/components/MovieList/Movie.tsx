import { FC, useState, useCallback, MouseEventHandler } from 'react';

import { MovieProps } from '../../types/movieList';

import Portal from '../Common/Portal';
import { useLazyImage } from '../../hooks';

export const Movie: FC<MovieProps> = ({ styles, item }) => {
	const { id, poster_path, title, vote_average, overview } = item;
	const imagePath = poster_path
		? `https://image.tmdb.org/t/p/w1280${poster_path}`
		: '/placeholder-movie.jpg'; // Add a placeholder image

	const [isShown, setIsShown] = useState(false);
	const imgRef = useLazyImage({
		src: imagePath,
		onLoad: () => console.log('Image loaded!'),
	});

	const handleMouseOver: MouseEventHandler<HTMLDivElement> = useCallback(() => {
		setIsShown(true);
	}, []);

	const handleMouseOut: MouseEventHandler<HTMLDivElement> = useCallback(() => {
		setIsShown(false);
	}, []);

	return (
		<>
			<div
				className={styles.imageWrapper}
				key={id}
				onMouseEnter={handleMouseOver}
				onMouseLeave={handleMouseOut}
			>
				<div className={styles.image}>
					<img ref={imgRef} width={150} height={200} alt={title} />;
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
