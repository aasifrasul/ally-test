import React from 'react';

import * as styles from './spinner.module.css';

interface SpinnerProps {
	// Add any props here if needed
}

const Spinner: React.FC<SpinnerProps> = () => {
	return (
		<div className={styles['global_spinner_overlay']}>
			<p>Loading...</p>
		</div>
	);
};

export default Spinner;
