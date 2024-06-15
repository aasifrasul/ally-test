import React from 'react';

import styles from './spinner.css';

const Spinner = (props) => {
	return (
		<div className={styles['global-spinner-overlay']}>
			<p>Loading...</p>
		</div>
	);
};

export default Spinner;
