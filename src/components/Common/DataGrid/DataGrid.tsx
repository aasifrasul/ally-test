import * as React from 'react';

import Cell from './Cell';
import * as styles from './DataGrid.module.css';

// Define types for component props
interface DataGridProps {
	headings: Array<{ name: string }>;
	rows: Array<Record<string, string | number>>;
}

const DataGrid: React.FC<DataGridProps> = ({ headings, rows }) => {
	const renderHeadingRow = (item: { name: string }, cellIndex: number) => (
		<Cell key={`heading-${cellIndex}`} content={item.name} header={true} styles={styles} />
	);

	const renderRow = (row: Record<string, string | number>, rowIndex: number) => (
		<div className={styles.row} key={`row-${rowIndex}`}>
			{Object.keys(row).map((key, cellIndex) => (
				<Cell key={`${key}-${cellIndex}`} content={row[key]} styles={styles} />
			))}
		</div>
	);

	const theadMarkup = (
		<div key="heading" className={styles.header}>
			{headings.map(renderHeadingRow)}
		</div>
	);

	const tbodyMarkup = <div className={styles.body}>{rows.map(renderRow)}</div>;

	return (
		<div className={styles.table}>
			{theadMarkup}
			{tbodyMarkup}
		</div>
	);
};

export default DataGrid;
