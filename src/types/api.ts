interface IS_Name {
	title: string;
	first: string;
	last: string;
}

interface IS_Street {
	number: number;
	name: string;
}

interface IS_Coordinates {
	latitude: string;
	longitude: string;
}

interface IS_Timezone {
	offset: string;
	description: string;
}

interface IS_Location {
	street: IS_Street;
	city: string;
	state: string;
	country: string;
	postcode: string;
	coordinates: IS_Coordinates;
	timezone: IS_Timezone;
}

interface IS_Login {
	uuid: string;
	username: string;
	password: string;
	salt: string;
	md5: string;
	sha1: string;
	sha256: string;
}

interface IS_DateAge {
	date: string;
	age: number;
}

interface IS_ID {
	name: string;
	value: string;
}

interface IS_Picture {
	large: string;
	medium: string;
	thumbnail: string;
}

export interface IS_UserData {
	gender: string;
	name: IS_Name;
	location: Location;
	email: string;
	login: IS_Login;
	dob: IS_DateAge;
	registered: IS_DateAge;
	phone: string;
	cell: string;
	id: IS_ID;
	picture: IS_Picture;
	nat: string;
}
