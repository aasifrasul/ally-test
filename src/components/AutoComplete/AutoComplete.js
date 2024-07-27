import React from 'react';

import InputText from '../Common/InputText';
import { debounce } from '../../utils/throttleAndDebounce';

import useOutsideClick from '../../hooks/useOutsideClick';

import { constants } from '../../constants';
import styles from './styles.css';

const AutoComplete = (props) => {
	const [activeSuggestion, setActiveSuggestion] = React.useState(0);
	const [filteredSuggestions, setFilteredSuggestions] = React.useState([]);
	const [showNoMatch, setShowNoMatch] = React.useState(false);
	const [suggestionsHtml, setSuggestionsHtml] = React.useState('');
	const [inputValue, setInputValue] = React.useState(''); // Added state to track input value
	const displayRef = React.useRef(null);
	const clickedOutside = useOutsideClick(displayRef);

	const reset = () => {
		setActiveSuggestion(0);
		setFilteredSuggestions([]);
		setShowNoMatch(false);
		setSuggestionsHtml('');
		setInputValue('');
	};

	const onChange = (searchedText) => {
		setInputValue(searchedText);
		setActiveSuggestion(0);

		if (searchedText) {
			const matchedSuggestions = props.suggestions.filter(
				(suggestion) =>
					suggestion.toLowerCase().indexOf(searchedText.toLowerCase()) > -1,
			);
			setFilteredSuggestions(matchedSuggestions);
			if (matchedSuggestions.length === 0) {
				setShowNoMatch(true);
			} else {
				setShowNoMatch(false);
			}
		} else {
			setFilteredSuggestions([]);
			setShowNoMatch(false);
		}
	};

	const onSuggestionClick = (e) => {
		setActiveSuggestion(0);
		setFilteredSuggestions([]);
		setInputValue(e.target.innerText); // Update input value to the clicked suggestion
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

	const debouncedOnChange = debounce(onChange, constants?.autoComplete?.debounceDelay);

	if (filteredSuggestions.length) {
		if (clickedOutside) {
			reset();
		} else {
			setSuggestionsHtml(
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
				</ul>,
			);
		}
	}
	if (showNoMatch) {
		setSuggestionsHtml(
			<div className={styles['no-suggestions']}>
				<em>No suggestions available.</em>
			</div>,
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
				value={inputValue}
				callback={debouncedOnChange}
				onKeyDown={onKeyDown}
			/>
			{suggestionsHtml}
		</>
	);
};

export default AutoComplete;
