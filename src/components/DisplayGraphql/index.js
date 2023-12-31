import React from 'react';

import { client } from '../../graphql/client';

export default function DisplayGraphql() {
	const [data, setData] = React.useState('');

	React.useEffect(() => {
		(async () => {
			let cancel = () => {
				/* abort the request if it is in-flight */
			};

			const result = await new Promise((resolve, reject) => {
				let result;
				cancel = client.subscribe(
					{
						query: '{ hello }',
					},
					{
						next: (data) => (result = data),
						error: reject,
						complete: () => resolve(result),
					},
				);
			});
			setData(result);
		})();
	}, []);

	return (
		<div>
			<span>{JSON.stringify(data)}</span>
		</div>
	);
}
