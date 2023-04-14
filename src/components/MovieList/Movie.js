import React, { useState } from 'react';

import Portal from '../Common/Portal/Portal';
import Image from '../Common/Image/Image';

export default function Movie(props) {
	const [isShown, setIsShown] = useState(false);
	const { styles, item } = props;
	const { id, poster_path, title, vote_average, overview } = item;
	const imagePath = poster_path ? `https://image.tmdb.org/t/p/w1280${poster_path}` : '';

	function changeBackground(e) {
		e.target.style.background = 'red';
	}

	return (
		<>
			<div
				className={styles.imageWrapper}
				key={id}
				onMouseOver={() => setIsShown(true)}
				onMouseOut={() => setIsShown(false)}
			>
				<div className={styles.image}>
					<Image src={imagePath} width="150" height="200" lazy="lazy" />
				</div>
				<div>
					{title} {vote_average}
				</div>
				{isShown && (
					<Portal
						container={document.querySelector(`.${styles.mouseOverWrapper}_${id}`)}
					>
						<div className={styles.imageWrapper}>{overview}</div>
					</Portal>
				)}
			</div>
			<div className={`${styles.mouseOverWrapper}_${id}`}></div>
		</>
	);
}
