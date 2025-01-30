import React from 'react';

import './styles.css';

interface PaginationProps {
	totalRowCount: number;
	pageSize: number;
	callback?: (pageNum: number) => void;
}

interface HandleClickEvent extends React.MouseEvent<HTMLDivElement> {
	target: HTMLButtonElement;
}

export default function Pagination({ totalRowCount, pageSize, callback }: PaginationProps) {
	const [selectedPage, setSelectedPage] = React.useState(1);
	const totalPages = Math.ceil(totalRowCount / pageSize);

	const handleClick = (e: HandleClickEvent) => {
		const pageNum = Number(e.target.innerHTML);
		setSelectedPage(pageNum);

		if (typeof callback === 'function') {
			callback(pageNum);
		}
	};

	return (
		<div className="pagination pagination-centered" onClick={handleClick}>
			{[...new Array(totalPages)].map((_, index) => {
				const currentPage = index + 1;
				return (
					<button
						className={selectedPage === currentPage ? 'active' : ''}
						key={currentPage}
					>
						{currentPage}
					</button>
				);
			})}
		</div>
	);
}
