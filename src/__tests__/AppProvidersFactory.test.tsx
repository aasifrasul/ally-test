import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { createStore } from 'redux';

import { createAppProviders } from '../AppProviders';

describe('createAppProviders', () => {
	it('creates an explicit provider tree with injected runtime dependencies', () => {
		const store = createStore((state = {}) => state);
		const client = {} as any;
		const TestApp = () => <div>App ready</div>;

		const AppProviderTree = createAppProviders({
			store,
			client,
			app: TestApp,
		});

		render(<AppProviderTree />);
		expect(screen.getByText('App ready')).toBeInTheDocument();
	});
});
