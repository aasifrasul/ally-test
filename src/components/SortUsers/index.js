import React, { useState, useRef } from 'react';

import useFetchData from '../../hooks/useFetchData';

import './styles.css';

const APIURL = 'https://jsonplaceholder.typicode.com/users';

function App() {
	const [sortedUsers, setSortedUsers] = useState([]);
	const clikCount = useRef(0);

	const { data: users, error, fetchData } = useFetchData();

	React.useEffect(() => {
		setSortedUsers(users);
	}, [users]);

	const getUsers = (e) => {
		e.preventDefault();
		fetchData(APIURL);
	};

	const sortList = (e) => {
		// sort the user list by name's length
		// on first click list will sorted in assending order
		// on second click list will be sorted in descending order
		// on third click default list will be rendered
		// on fourth click again start form step 1
		e.preventDefault();
		clikCount.current++;
		let newUsers;

		switch (clikCount.current) {
			case 1:
				newUsers = [...users].sort((a, b) => a.name.length - b.name.length);
				break;
			case 2:
				newUsers = [...users].sort((a, b) => b.name.length - a.name.length);
				break;
			case 3:
				newUsers = [...users];
				break;
			default:
				break;
		}
		setSortedUsers(newUsers);
		clikCount.current = clikCount.current % 3;
	};

	return (
		<main>
			<h1>User List</h1>
			<div>
				<button onClick={getUsers}>Get Users</button>
				<button onClick={sortList}>Sort list by name's length</button>
			</div>
			<ul>
				{sortedUsers?.map((user) => {
					return (
						<div key={user.id}>
							{user.name} {user.name.length}
						</div>
					);
				})}
			</ul>
		</main>
	);
}

export default App;
