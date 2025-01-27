import * as React from 'react';

import AdvancedTruncate from '../AdvancedTruncate';
import { useHover } from '../../../hooks/useHover';

interface CellProps {
	content: React.ReactNode;
	header?: boolean;
	styles: {
		headerCell?: string;
		rowCell?: string;
		truncate?: string;
	};
}

const Cell: React.FC<CellProps> = ({ content, header = false, styles }) => {
	const [hoverRef, isHovered] = useHover();

	const cellMarkup = header ? (
		<div className={`${styles.headerCell}`}>{content}</div>
	) : (
		<div className={`${styles.rowCell} ${styles.truncate}`} ref={hoverRef}>
			<AdvancedTruncate
				text={content as string}
				maxLength={10}
				showFullTextButton={isHovered}
				customClass={styles.truncate}
			/>
		</div>
	);

	return cellMarkup;
};

export default Cell;
