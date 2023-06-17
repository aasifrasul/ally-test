import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
//import userEvent from '@testing-library/user-event';
import AutoComplete from './AutoComplete';
import { constants } from '../../utils/Constants';

AutoComplete.props = {};
AutoComplete.props.suggestions = constants?.autoComplete?.initialFeed;

describe('AutoComplete', () => {
    let getByText;
	beforeEach(() => {
        getByText = render(<AutoComplete />).getByText;
	});

	test('renders AutoComplete component', () => {
		getByText('Search Item:'); ;
	});

    afterEach(() => {
		jest.clearAllMocks();
	});
});
