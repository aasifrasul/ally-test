import * as React from 'react';
import { Table, TableHeader, TableBody, TableCell, TableRow, TableHeaderCell } from '../Table';
import { Segment } from '../Segment';
import AdvancedTruncate from '../AdvancedTruncate';

// Define types for component props
interface DataGridProps {
	headings: Array<{ name: string; key: string }>;
	rows: Array<Record<string, string | number>>;
}

const DataGrid: React.FC<DataGridProps> = ({ headings, rows }) => {
	const renderHeadingRow = () => (
		<TableRow key="heading-row">
			{headings.map((item, index) => (
				<TableHeaderCell key={`heading-${index}`}>{item.name}</TableHeaderCell>
			))}
		</TableRow>
	);

	const renderRow = (row: Record<string, string | number>, rowIndex: number) => (
		<TableRow key={`row-${rowIndex}`}>
			{headings.map(({ key }, index) => (
				<TableCell key={`${key}-${index}`}>
					<AdvancedTruncate text={row[key] as string} maxLength={10} />
				</TableCell>
			))}
		</TableRow>
	);

	const theadMarkup = <TableHeader>{renderHeadingRow()}</TableHeader>;

	const tbodyMarkup = <TableBody>{rows.map(renderRow)}</TableBody>;

	return (
		<Segment>
			<Table celled striped>
				{theadMarkup}
				{tbodyMarkup}
			</Table>
		</Segment>
	);
};

export default DataGrid;
