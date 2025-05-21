import GridData from '../Common/GridData/GridData';
import OSStatistics from '../Common/OSStatistics/OSStatistics';
import { SocketProvider } from '../../Context/SocketProvider';

export default function CurrencyStream() {
	return (
		<SocketProvider>
			<OSStatistics />
			<GridData />
		</SocketProvider>
	);
}
