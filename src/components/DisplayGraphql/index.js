import React from 'react';

import { subscribe } from '../../graphql/client';

export default function DisplayGraphql() {
	const [data, setData] = React.useState('');

	React.useEffect(() => {
		subscribe('{ user {id, name, age} }').then((result) => {
			setData(result);
		});
	}, []);

	return (
		<div>
			<span>{JSON.stringify(data)}</span>
		</div>
	);
}
