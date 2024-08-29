import React, { useState, useRef } from 'react';

import InputText from '../Common/InputText';

import useOutsideClick from '../../hooks/useOutsideClick';

import { constants } from '../../constants';
import styles from './styles.css';

const AutoComplete = (props) => {
	const [activeSuggestion, setActiveSuggestion] = useState(0);
	const [filteredSuggestions, setFilteredSuggestions] = useState([]);
	const [showNoMatch, setShowNoMatch] = useState(false);
	const [inputValue, setInputValue] = useState('');
	const displayRef = useRef(null);
	const clickedOutside = useOutsideClick(displayRef);
	const suggestionsHtmlRef = useRef('');

	const reset = () => {
		setActiveSuggestion(0);
		setFilteredSuggestions([]);
		setShowNoMatch(false);
		suggestionsHtmlRef.current = '';
		setInputValue('');
	};

	const onChange = (searchText) => {
		setInputValue(searchText);
		setActiveSuggestion(0);

		if (searchText) {
			const lowerCasedSearchText = searchText.toLowerCase();
			const matchedSuggestions = props.suggestions.filter(
				(suggestion) => suggestion.toLowerCase().indexOf(lowerCasedSearchText) > -1,
			);
			setFilteredSuggestions(matchedSuggestions);
			setShowNoMatch(!matchedSuggestions.length);
		} else {
			setFilteredSuggestions([]);
			setShowNoMatch(false);
		}
	};

	const onSuggestionClick = (e) => {
		setActiveSuggestion(0);
		setFilteredSuggestions([]);
		const newValue = e.target.innerText;
		setInputValue(newValue);
		suggestionsHtmlRef.current = (
			<div className={styles['selected']}>
				<b>{newValue}</b>
			</div>
		);
	};

	const onKeyDown = (e) => {
		if (e.keyCode === 13) {
			setActiveSuggestion(0);
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

	if (filteredSuggestions.length) {
		if (clickedOutside) {
			reset();
		} else {
			suggestionsHtmlRef.current = (
				<ul className={styles.suggestions} ref={displayRef}>
					{filteredSuggestions.map((suggestion, index) => {
						let className;

						// Flag the active suggestion with a class
						if (index === activeSuggestion) {
							className = styles['suggestion-active'];
						}
						return (
							<li
								className={className}
								key={suggestion}
								onClick={(e) => onSuggestionClick(e)}
							>
								{suggestion}
							</li>
						);
					})}
				</ul>
			);
		}
	}
	if (showNoMatch) {
		suggestionsHtmlRef.current = (
			<div className={styles['no-suggestions']}>
				<em>No suggestions available.</em>
			</div>
		);
	}

	return (
		<>
			<div className={styles.center}>
				<button onClick={() => reset()}>Reset</button>
			</div>
			<div>Search Item:</div>
			<InputText
				id="autoCompleteInput"
				initialValue={inputValue}
				onChange={onChange}
				onKeyDown={onKeyDown}
				debounceDelay={constants?.autoComplete?.debounceDelay}
			/>
			{suggestionsHtmlRef.current}
		</>
	);
};

export default AutoComplete;
