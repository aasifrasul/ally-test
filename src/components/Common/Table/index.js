import React from 'react';

import styles from './styles.css';

export default function Table({ headers, rowData, keyIdentifier, tableWidth, sortCallback }) {
	const sortState = React.useRef({});
	const inlineStyle = {};

	if (tableWidth) {
		inlineStyle.width = tableWidth;
	}

	const handleHeaderClick = (e) => {
		e.preventDefault();
		const key = e.target.getAttribute('data-header-key');
		const currentKeySort = sortState.current[key];
		sortState.current = {};
		sortState.current[key] = !currentKeySort;
		sortCallback && sortCallback(key, sortState.current[key]);
	};

	const headerHtml = headers?.map(({ key, value }, id) => {
		let ascDescClass = '';
		if (key in sortState.current) {
			ascDescClass = sortState.current[key] ? 'asc' : 'desc';
		}

		return (
			<span className={styles['cell']} key={key} data-header-key={key}>
				{value} <span className={styles[ascDescClass]}></span>
			</span>
		);
	});

	const rowDataHtml =
		rowData &&
		rowData?.map((row) => (
			<div className={styles['row']} key={row[keyIdentifier]}>
				{headers?.map(({ key }) => (
					<span className={styles['cell']} key={key}>
						{row[key]}
					</span>
				))}
				{Array.isArray(row) &&
					row?.map((param, id) => (
						<span className={styles['cell']} key={id}>
							param
						</span>
					))}
			</div>
		));

	return (
		<div className={styles['table']} style={inlineStyle}>
			<div className={`${styles['row']} ${styles['header']}`} onClick={handleHeaderClick}>
				{headerHtml}
			</div>
			{rowDataHtml}
		</div>
	);
}
