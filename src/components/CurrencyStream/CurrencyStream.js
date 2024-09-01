import React from 'react';

import GridData from '../Common/GridData/GridData';
import OSStatistics from '../Common/OSStatistics/OSStatistics';

import queue from '../../utils/SPQueue';

function CurrencyStream(props) {
	return (
		<div>
			<OSStatistics />
			<GridData queue={queue} />
		</div>
	);
}

export default CurrencyStream;
