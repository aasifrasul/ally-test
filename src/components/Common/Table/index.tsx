interface TableProps {
	children: React.ReactNode;
	striped?: boolean;
	celled?: boolean;
	className?: string;
}

export const Table: React.FC<TableProps> = ({ 
	children, 
	striped = false,
	celled = true,
	className = '' 
}) => {
	const baseClasses = 'min-w-full bg-white';
	const stripedClass = striped ? '[&_tbody_tr:nth-child(odd)]:bg-gray-50' : '';
	const celledClass = celled ? '[&_td]:border [&_th]:border [&_td]:border-gray-200 [&_th]:border-gray-200' : '';
  
	return (
		<div className="overflow-x-auto">
			<table className={`${baseClasses} ${stripedClass} ${celledClass} ${className}`}>
				{children}
			</table>
		</div>
	);
};

// Table sub-components
export const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<thead className="bg-gray-50">
		{children}
	</thead>
);

export const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<tbody className="divide-y divide-gray-200">
		{children}
	</tbody>
);

export const TableFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<tfoot className="bg-gray-50">
		{children}
	</tfoot>
);

interface TableRowProps {
	children: React.ReactNode;
	className?: string;
	onClick?: () => void;
	active?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({ 
	children, 
	className = '',
	onClick,
	active = false
}) => {
	const activeClass = active ? 'bg-blue-50 border-blue-200' : '';
	const clickableClass = onClick ? 'cursor-pointer' : '';
	
	return (
		<tr 
			className={`hover:bg-gray-50 ${activeClass} ${clickableClass} ${className}`}
			onClick={onClick}
		>
			{children}
		</tr>
	);
};

interface TableHeaderCellProps {
	children: React.ReactNode;
	className?: string;
	colSpan?: number;
}

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({ 
	children, 
	className = '',
	colSpan
}) => (
	<th 
		className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
		colSpan={colSpan}
	>
		{children}
	</th>
);

interface TableCellProps {
	children: React.ReactNode;
	className?: string;
	colSpan?: number;
}

export const TableCell: React.FC<TableCellProps> = ({ 
	children, 
	className = '',
	colSpan
}) => (
	<td 
		className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}
		colSpan={colSpan}
	>
		{children}
	</td>
);