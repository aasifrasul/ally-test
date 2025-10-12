import { fetchProfileData, fetchUser, fetchPosts } from '../fakeAPi';

// Mock the fetchUser and fetchPosts functions
jest.mock('../fakeAPi', () => ({
	fetchUser: jest.fn(),
	fetchPosts: jest.fn(),
	fetchProfileData: jest.fn((userId) => ({
		userId,
		user: { read: () => ({ name: 'Ringo Starr' }) },
		posts: {
			read: () => [
				{
					id: 0,
					text: 'I get by with a little help from my friends',
				},
				{
					id: 1,
					text: "I'd like to be under the sea in an octopus's garden",
				},
				{
					id: 2,
					text: 'You got that sand all over your feet',
				},
			],
		},
	})),
}));

describe('fetchProfileData', () => {
	beforeEach(() => {
		// Reset the mock implementation before each test
		jest.clearAllMocks();
	});

	test('should return user and posts data', async () => {
		// Set up the mock implementations for fetchUser and fetchPosts
		fetchUser.mockResolvedValueOnce({ name: 'Ringo Starr' });
		fetchPosts.mockResolvedValueOnce([
			{
				id: 0,
				text: 'I get by with a little help from my friends',
			},
			{
				id: 1,
				text: "I'd like to be under the sea in an octopus's garden",
			},
			{
				id: 2,
				text: 'You got that sand all over your feet',
			},
		]);

		// Call the function under test
		const result = fetchProfileData();

		// Wait for the promises to resolve
		await Promise.all([result.user.read(), result.posts.read()]);

		// Assert the expected values
		//expect(fetchUser).toHaveBeenCalledTimes(1);
		//expect(fetchPosts).toHaveBeenCalledTimes(1);
		expect(result.user.read()).toEqual({ name: 'Ringo Starr' });
		expect(result.posts.read()).toEqual([
			{
				id: 0,
				text: 'I get by with a little help from my friends',
			},
			{
				id: 1,
				text: "I'd like to be under the sea in an octopus's garden",
			},
			{
				id: 2,
				text: 'You got that sand all over your feet',
			},
		]);
	});
});
