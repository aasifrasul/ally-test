import React, { useState } from 'react';
import * as styles from './styles.module.css';

interface TableProps {
	headers: Array<{ key: string; value: string }>;
	rowData: Array<Record<string, string | number>>;
	keyIdentifier: string;
	tableWidth?: string;
	sortCallback?: (key: string, asc: boolean) => void;
}

interface SortState {
	key: string | null;
	ascending: boolean;
}

export default function Table({
	headers,
	rowData,
	keyIdentifier,
	tableWidth,
	sortCallback,
}: TableProps) {
	const [sortState, setSortState] = useState<SortState>({
		key: null,
		ascending: true,
	});

	const handleHeaderClick = (key: string) => {
		setSortState((prevState) => ({
			key,
			ascending: prevState.key === key ? !prevState.ascending : true,
		}));
		sortCallback?.(key, sortState.ascending);
	};

	const renderHeader = ({ key, value }: { key: string; value: string }) => {
		const isSorted = sortState.key === key;
		const sortDirectionClass = isSorted
			? sortState.ascending
				? styles.asc
				: styles.desc
			: '';

		return (
			<th
				key={key}
				className={styles.cell}
				onClick={() => handleHeaderClick(key)}
				role="columnheader"
				aria-sort={
					isSorted ? (sortState.ascending ? 'ascending' : 'descending') : 'none'
				}
			>
				{value}
				<span className={sortDirectionClass} aria-hidden="true" />
			</th>
		);
	};

	const renderRow = (row: Record<string, string | number>) => (
		<tr key={row[keyIdentifier]} className={styles.row} role="row">
			{headers.map(({ key }) => (
				<td key={key} className={styles.cell}>
					{row[key]}
				</td>
			))}
		</tr>
	);

	return (
		<table className={styles.table} style={{ width: tableWidth }} role="table">
			<thead>
				<tr className={`${styles.row} ${styles.header}`} role="row">
					{headers.map(renderHeader)}
				</tr>
			</thead>
			<tbody>{rowData.map(renderRow)}</tbody>
		</table>
	);
}
