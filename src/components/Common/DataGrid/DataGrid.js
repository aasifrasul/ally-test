import * as React from 'react';
import Cell from './Cell';

import css from './DataGrid.css';

const styles = css?.locals;

function DataGrid(props) {
	const { headings, rows } = props;
	const renderHeadingRow = (item, cellIndex) => {
		return (
			<Cell
				key={`heading-${cellIndex}`}
				content={item['name']}
				header={true}
				styles={styles}
			/>
		);
	};

	const renderRow = (row, rowIndex) => {
		return (
			<div className={styles.row} key={`row-${rowIndex}`}>
				{Object.keys(row).map((key, cellIndex) => {
					return (
						<Cell key={`${key}-${cellIndex}`} content={row[key]} styles={styles} />
					);
				})}
			</div>
		);
	};

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
}

export default DataGrid;
