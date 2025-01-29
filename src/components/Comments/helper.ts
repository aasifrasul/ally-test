const initialUsers = [
	'Helen Stevens',
	'Dan Jenkin',
	'John Doe',
	'Ethel Howard Daniel',
	'Johan Hansen',
	'Hermelinda Murillo',
	'Irma Vidal',
	'Misaela, Peixoto',
	'Giray Tekelioğlu',
	'Patrick, Neal',
];

interface TimestampFormatter {
	(timestamp: number): string;
}

const formatTimeStamp: TimestampFormatter = (timestamp) => {
	const date = new Date(timestamp);

	const day = date.getDate();
	const month = date.toLocaleString('default', { month: 'short' });
	const year = date.getFullYear();
	const hours = date.getHours();
	const minutes = date.getMinutes();

	const formattedDate = `${day} ${month} ${year} ${hours}:${minutes}`;

	// console.log(formattedDate); // Output: 4 Dec 2020 19:34

	return formattedDate;
};

const endpoint = 'https://mocki.io/v1/b0c7d7ea-5d09-4b9c-8d4b-c1b40cc39bc9';

export { formatTimeStamp, initialUsers, endpoint };
