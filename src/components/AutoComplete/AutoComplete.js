import React from 'react';

import InputText from '../Common/InputText';
import { debounce } from '../../utils/throttleAndDebounce';

import useOutsideClick from '../../hooks/useOutsideClick';

import { constants } from '../../utils/Constants';
import styles from './styles.css';

const Autocomplete = (props) => {
	const [activeSuggestion, setActiveSuggestion] = React.useState(0);
	const [filteredSuggestions, setFilteredSuggestions] = React.useState([]);
	const inputTextRef = React.useRef('');
	const displayRef = React.useRef(null);
	let suggestionsListHtml;
	const clickedOutside = useOutsideClick(displayRef);

	const onChange = (e) => {
		const { suggestions } = props;
		const searchTextLowerCase = inputTextRef.current?.toLowerCase();

		const filteredSuggestions = suggestions.filter(
			(suggestion) => suggestion.toLowerCase().indexOf(searchTextLowerCase) > -1,
		);

		setActiveSuggestion(0);
		setFilteredSuggestions(() => filteredSuggestions);
	};

	const onClick = (e) => {
		inputTextRef.current = e.target.innerText;
		setActiveSuggestion(0);
		setFilteredSuggestions(() => []);
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
		if (filteredSuggestions.length) {
			if (clickedOutside) {
				setActiveSuggestion(0);
				setFilteredSuggestions(() => []);
				suggestionsListHtml = '';
			} else {
				suggestionsListHtml = (
					<ul className={styles.suggestions} ref={displayRef}>
						{filteredSuggestions.map((suggestion, index) => {
							let className;

							// Flag the active suggestion with a class
							if (index === activeSuggestion) {
								className = styles['suggestion-active'];
							}
							return (
								<li className={className} key={suggestion} onClick={onClick}>
									{suggestion}
								</li>
							);
						})}
					</ul>
				);
			}
		} else {
			suggestionsListHtml = (
				<div className={styles['no-suggestions']}>
					<em>No suggestions available.</em>
				</div>
			);
		}
	}

	return (
		<>
			<div>Search Item:</div>
			<InputText
				inputTextRef={inputTextRef}
				onChange={debouncedOnChange}
				onKeyDown={onKeyDown}
			/>
			{suggestionsListHtml}
		</>
	);
};

export default Autocomplete;
