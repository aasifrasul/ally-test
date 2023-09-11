import React from 'react';

import './styles.css';

export default function Pagination({ totalRowCount, pageSize, callback }) {
	const [selectedPage, setSelectedPage] = React.useState(1);
	const totalPages = Math.ceil(totalRowCount / pageSize);

	const handleClick = (e) => {
		const pageNum = Number(e.target.innerHTML);
		setSelectedPage(pageNum);
		callback && callback(pageNum);
	};

	return (
		<div className="pagination pagination-centered" onClick={handleClick}>
			{[...new Array(totalPages)].map((item, index) => {
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
