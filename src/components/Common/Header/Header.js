import React from 'react';
import { useHistory } from 'react-router-dom';

function Header({ children }) {
	const history = useHistory();

	return (
		<>
			<header>
				<button onClick={() => history.goBack()}>Go Back</button>
			</header>
			{children}
		</>
	);
}

export default Header;
