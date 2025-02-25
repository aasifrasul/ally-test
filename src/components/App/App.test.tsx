import { render, screen } from '@testing-library/react';
import React from 'react';
import App from '.';

test('renders the landing page', () => {
	render(<App />);
});
