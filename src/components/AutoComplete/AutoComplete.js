import React, { Component, Fragment } from 'react';

import InputText from '../Common/InputText';
import { debounce } from '../../utils/throttleAndDebounce';

import { constants } from '../../utils/Constants';
import './styles.css';

const Autocomplete = (props) => {
	const [activeSuggestion, setActiveSuggestion] = React.useState(0);
	const [filteredSuggestions, setFilteredSuggestions] = React.useState([]);
	const [showSuggestions, setShowSuggestions] = React.useState(false);
	const [userInput, setUserInput] = React.useState('');
	const inputTextRef = React.useRef('');
	let suggestionsListHtml;

	const onChange = (e) => {
		const { suggestions } = props;
		const searchText = e.target.value;
		const searchTextLowerCase = searchText.toLowerCase();

		const filteredSuggestions = suggestions.filter(
			(suggestion) => suggestion.toLowerCase().indexOf(searchTextLowerCase) > -1,
		);

		setActiveSuggestion(0);
		setFilteredSuggestions(() => filteredSuggestions);
		setShowSuggestions(true);
		setUserInput(() => searchText);
	};

	const onClick = (e) => {
		inputTextRef.current = e.target.innerText;
		setActiveSuggestion(0);
		setFilteredSuggestions(() => []);
		setShowSuggestions(false);
	};

	const onKeyDown = (e) => {
		if (e.keyCode === 13) {
			setActiveSuggestion(0);
			setShowSuggestions(false);
			setUserInput(() => filteredSuggestions[activeSuggestion]);
		} else if (e.keyCode === 38) {
			if (activeSuggestion === 0) {
				return;
			}
			setActiveSuggestion((curActiveSuggestion) => curActiveSuggestion - 1);
		} else if (e.keyCode === 40) {
			// User pressed the down arrow, increment the index
			if (activeSuggestion - 1 === filteredSuggestions.length) {
				return;
			}
			setActiveSuggestion((curActiveSuggestion) => curActiveSuggestion + 1);
		}
	};

	const debouncedOnChange = debounce(onChange, constants?.autoComplete?.debounceDelay);

	if (showSuggestions && userInput) {
		if (filteredSuggestions.length) {
			suggestionsListHtml = (
				<ul className="suggestions">
					{filteredSuggestions.map((suggestion, index) => {
						let className;

						// Flag the active suggestion with a class
						if (index === activeSuggestion) {
							className = 'suggestion-active';
						}
						return (
							<li className={className} key={suggestion} onClick={onClick}>
								{suggestion}
							</li>
						);
					})}
				</ul>
			);
		} else {
			suggestionsListHtml = (
				<div className="no-suggestions">
					<em>No suggestions available.</em>
				</div>
			);
		}
	}

	return (
		<Fragment>
			<InputText
				label="Search Item:"
				inputTextRef={inputTextRef}
				onChange={debouncedOnChange}
				onKeyDown={onKeyDown}
			/>
			{suggestionsListHtml}
		</Fragment>
	);
};

export default Autocomplete;
