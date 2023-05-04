import React from 'react';

import css from './spinner.css';

const styles = css?.locals;

const Spinner = (props) => {
	return (
		<div className={styles['global-spinner-overlay']}>
			<p>Loading...</p>
		</div>
	);
};

export default Spinner;
