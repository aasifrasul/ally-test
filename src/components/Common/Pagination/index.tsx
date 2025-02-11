import React from 'react';

interface PaginationProps {
	totalRowCount: number;
	pageSize: number;
	maxDisplayPageCount?: number;
	onPageChange?: (pageNum: number) => void;
	initialPage?: number;
}

export default function Pagination({
	totalRowCount,
	pageSize,
	maxDisplayPageCount,
	onPageChange,
	initialPage = 1,
}: PaginationProps) {
	const [selectedPage, setSelectedPage] = React.useState(initialPage);
	const totalPages = Math.ceil(totalRowCount / pageSize);

	const handleClick = (pageNum: number) => {
		setSelectedPage(pageNum);
		onPageChange?.(pageNum);
	};

	if (totalPages <= 1) return null;

	return (
		<div className="flex gap-2 justify-center items-center">
			<button
				type="button"
				aria-label="Previous Page"
				onClick={() => handleClick(Math.max(1, selectedPage - 1))}
				disabled={selectedPage === 1}
				className="px-3 py-1 rounded disabled:opacity-50"
			>
				Previous
			</button>

			{[...Array(totalPages)].map((_, index) => {
				const pageNum = index + 1;
				return (
					<button
						type="button"
						key={pageNum}
						aria-label={`Go to page ${pageNum}`}
						aria-current={selectedPage === pageNum ? 'page' : undefined}
						onClick={() => handleClick(pageNum)}
						className={`px-3 py-1 rounded ${
							selectedPage === pageNum
								? 'bg-blue-500 text-white'
								: 'hover:bg-gray-100'
						}`}
					>
						{pageNum}
					</button>
				);
			})}

			<button
				type="button"
				aria-label="Next Page"
				onClick={() => handleClick(Math.min(totalPages, selectedPage + 1))}
				disabled={selectedPage === totalPages}
				className="px-3 py-1 rounded disabled:opacity-50"
			>
				Next
			</button>
		</div>
	);
}
