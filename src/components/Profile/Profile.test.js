import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
//import userEvent from '@testing-library/user-event';
import Profile from './Profile';

jest.mock('../../utils/fakeAPi', () => ({
	fetchProfileData: () =>
		({
			userId: 1,
			user: { read: () => ({ name: 'John Doe' }) },
			posts: { read: () => [{ id: 1, text: 'Post 1' }] },
		}),
}));

describe('Profile', () => {
    let getByText;
	beforeEach(() => {
		const mockProfileData = {
			user: { read: () => ({ name: 'John Doe' }) },
			posts: { read: () => [{ id: 1, text: 'Post 1' }] },
		};
		global.fetchProfileData = jest.fn(() => Promise.resolve(mockProfileData));
        getByText = render(<Profile />).getByText;
	});

	test('renders ProfilePage and ProfileTimeline components', () => {
		expect(screen.getByRole('heading')).toHaveTextContent('John Doe');
		getByText('Post 1'); ;
	});

	test('updates user and post data when clicking the Next button', async () => {
		await fireEvent.click(screen.getByRole('button'));
        getByText('John Doe'); ;
        getByText('Post 1'); ;
	});

    afterEach(() => {
		jest.clearAllMocks();
	});
});
