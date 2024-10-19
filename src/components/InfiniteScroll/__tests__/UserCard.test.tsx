import { render, screen } from '@testing-library/react';
import UserCard from '../UserCard';

// Mock the Image component
jest.mock('../../Common/Image', () => {
	return function MockImage({
		src,
		alt,
		styles,
	}: {
		src: string;
		alt: string;
		styles: string;
	}) {
		return <img src={src} alt={alt} className={styles} />;
	};
});

describe('UserCard', () => {
	const mockData = {
		picture: { medium: 'https://example.com/image.jpg' },
		name: { first: 'John', last: 'Doe' },
		location: { city: 'New York', country: 'USA' },
		email: 'john.doe@example.com',
	};

	it('renders user information correctly', () => {
		render(<UserCard data={mockData} />);

		expect(screen.getByText('John Doe')).toBeInTheDocument();
		expect(screen.getByText('New York, USA')).toBeInTheDocument();
		expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
		expect(screen.getByAltText('user')).toHaveAttribute(
			'src',
			'https://example.com/image.jpg',
		);
	});

	it('renders placeholder when image is not provided', () => {
		const dataWithoutImage = { ...mockData, picture: undefined };
		render(<UserCard data={dataWithoutImage} />);

		expect(screen.queryByAltText('user')).not.toBeInTheDocument();
	});

	it('handles missing name gracefully', () => {
		const dataWithoutName = { ...mockData, name: undefined };
		render(<UserCard data={dataWithoutName} />);

		expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
	});

	it('handles missing location gracefully', () => {
		const dataWithoutLocation = { ...mockData, location: undefined };
		render(<UserCard data={dataWithoutLocation} />);

		expect(screen.queryByText('New York, USA')).not.toBeInTheDocument();
	});

	it('handles missing email gracefully', () => {
		const dataWithoutEmail = { ...mockData, email: undefined };
		render(<UserCard data={dataWithoutEmail} />);

		expect(screen.queryByText('john.doe@example.com')).not.toBeInTheDocument();
	});
});
