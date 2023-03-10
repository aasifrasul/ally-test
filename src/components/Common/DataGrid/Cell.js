import * as React from 'react';

import useHover from '../../../hooks/useHover';

function Cell({ content, header, styles }) {
	const [hoverRef, isHovered] = useHover();

	// isHovered && window.alert(content);

	const cellMarkup = header ? (
		<div className={`${styles.headerCell}`}>{content}</div>
	) : (
		<div className={`${styles.rowCell} ${styles.truncate}`} ref={hoverRef}>
			{content}
		</div>
	);

	return cellMarkup;
}

export default Cell;
