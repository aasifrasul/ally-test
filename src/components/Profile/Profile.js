import React, { Suspense, useState } from 'react';
import * as ReactDOM from 'react-dom/client';

import { fetchProfileData } from '../../utils/fakeAPi';

const initialResource = fetchProfileData(0);

const getNextId = (i) => ++i;

function App() {
	const [resource, setResource] = useState(initialResource);
	return (
		<>
			<button
				onClick={() => {
					const nextUserId = getNextId(resource.userId);
					setResource(fetchProfileData(nextUserId));
				}}
			>
				Next
			</button>
			<ProfilePage resource={resource} />
		</>
	);
}

function ProfilePage({ resource }) {
	return (
		<Suspense fallback={<h1>Loading profile...</h1>}>
			<ProfileDetails resource={resource} />
			<Suspense fallback={<h1>Loading posts...</h1>}>
				<ProfileTimeline resource={resource} />
			</Suspense>
		</Suspense>
	);
}

function ProfileDetails({ resource }) {
	const user = resource.user.read();
	return <h1>{user.name}</h1>;
}

function ProfileTimeline({ resource }) {
	const posts = resource.posts.read();
	return (
		<ul>
			{posts.map((post) => (
				<li key={post.id}>{post.text}</li>
			))}
		</ul>
	);
}

export default App;
