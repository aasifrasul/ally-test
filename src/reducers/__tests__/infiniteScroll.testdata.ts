import { type IS_UserData } from '../../types/api';

export const mockUserData: IS_UserData[] = [
	{
		gender: 'male',
		name: {
			title: 'Mr',
			first: 'Jeremy',
			last: 'Ambrose',
		},
		location: {
			street: {
				number: 8439,
				name: '20th Ave',
			},
			city: 'Lasalle',
			state: 'British Columbia',
			country: 'Canada',
			postcode: 'U7F 3X6',
			coordinates: {
				latitude: '-64.8693',
				longitude: '-36.1954',
			},
			timezone: {
				offset: '+3:00',
				description: 'Baghdad, Riyadh, Moscow, St. Petersburg',
			},
		},
		email: 'jeremy.ambrose@example.com',
		login: {
			uuid: '708d0816-55e7-4048-8ee2-8593fc84b520',
			username: 'tinycat571',
			password: 'underwear',
			salt: 'xu4BatGX',
			md5: '322a5a313526189fbd6831882e1b388f',
			sha1: '7ce8994f9440f1ecdb7b6289b35a1a8d1ab978c3',
			sha256: '3cfeecee0cbf1d54d70f3ed34f301f97bb44fc8b0384e718b9c1bc583723bdfe',
		},
		dob: {
			date: '1963-04-04T01:05:04.358Z',
			age: 61,
		},
		registered: {
			date: '2013-08-03T21:08:07.230Z',
			age: 11,
		},
		phone: 'Y75 H73-1011',
		cell: 'O66 F29-4676',
		id: {
			name: 'SIN',
			value: '671697787',
		},
		picture: {
			large: 'https://randomuser.me/api/portraits/men/24.jpg',
			medium: 'https://randomuser.me/api/portraits/med/men/24.jpg',
			thumbnail: 'https://randomuser.me/api/portraits/thumb/men/24.jpg',
		},
		nat: 'CA',
	},
	{
		gender: 'male',
		name: {
			title: 'Mr',
			first: 'Servando',
			last: 'Rosas',
		},
		location: {
			street: {
				number: 4131,
				name: 'Pasaje Quesada',
			},
			city: 'Magdalena',
			state: 'Michoacan',
			country: 'Mexico',
			postcode: 84240,
			coordinates: {
				latitude: '-61.8444',
				longitude: '-118.5864',
			},
			timezone: {
				offset: '+5:30',
				description: 'Bombay, Calcutta, Madras, New Delhi',
			},
		},
		email: 'servando.rosas@example.com',
		login: {
			uuid: '8aa33f6a-bbb9-4ceb-a512-ac2afccdbcc3',
			username: 'yellowzebra356',
			password: 'bicycle',
			salt: 'ETIOEf7h',
			md5: 'e73b520e5d75be0a212d74193fe95200',
			sha1: '23c33c8fdca9f3954845d44c158d81b0931e6db0',
			sha256: 'd1a658dc0f2fa3c626342a4a74e5675d628cfeeaff84dd3d6e3335bf73290f1c',
		},
		dob: {
			date: '1952-04-28T14:05:05.869Z',
			age: 72,
		},
		registered: {
			date: '2005-04-07T04:43:34.585Z',
			age: 19,
		},
		phone: '(689) 997 7311',
		cell: '(630) 659 0230',
		id: {
			name: 'NSS',
			value: '48 85 41 5769 0',
		},
		picture: {
			large: 'https://randomuser.me/api/portraits/men/83.jpg',
			medium: 'https://randomuser.me/api/portraits/med/men/83.jpg',
			thumbnail: 'https://randomuser.me/api/portraits/thumb/men/83.jpg',
		},
		nat: 'MX',
	},
];
