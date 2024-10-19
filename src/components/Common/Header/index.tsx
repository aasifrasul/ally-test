import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
	children: ReactNode;
}

const Header: React.FC<HeaderProps> = ({ children }) => {
	const navigate = useNavigate();

	return (
		<>
			<header>
				<button onClick={() => navigate(-1)}>Go Back</button>
			</header>
			{children}
		</>
	);
};

export default Header;
