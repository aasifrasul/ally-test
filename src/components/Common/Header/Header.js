import React from 'react';
import { useNavigate } from 'react-router-dom';

function Header({ children }) {
	const navigate = useNavigate();

	return (
		<>
			<header>
				<button onClick={() => navigate(-1)}>Go Back</button>
			</header>
			{children}
		</>
	);
}

export default Header;
