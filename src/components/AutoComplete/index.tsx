import React, {
	useEffect,
	useState,
	useRef,
	useMemo,
	useCallback,
	useId,
	KeyboardEvent,
} from 'react';

import useOutsideClick from '../../hooks/useOutsideClick';
import { constants } from '../../constants';
import styles from './styles.module.css';

interface AutoCompleteProps {
	suggestions: string[];
	onSelect?: (value: string) => void;
	placeholder?: string;
	maxSuggestions?: number;
	debounceDelay?: number;
}

const AutoComplete: React.FC<AutoCompleteProps> = ({
	suggestions = [],
	onSelect,
	placeholder = 'Search...',
	maxSuggestions = 10,
	debounceDelay = constants?.autoComplete?.debounceDelay || 300,
}) => {
	const [activeSuggestion, setActiveSuggestion] = useState(0);
	const [inputValue, setInputValue] = useState('');

	const displayRef = useRef<HTMLUListElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const clickedOutside = useOutsideClick(false, 'mousedown');

	const suggestionListId = useId();
	const inputId = useId();

	const filteredSuggestions = useMemo(() => {
		if (!inputValue) return [];
		const lowerCasedSearchText = inputValue.toLowerCase();
		return suggestions
			.filter((suggestion) => suggestion.toLowerCase().includes(lowerCasedSearchText))
			.slice(0, maxSuggestions);
	}, [inputValue, suggestions, maxSuggestions]);

	const reset = useCallback(() => {
		setInputValue('');
		setActiveSuggestion(0);
	}, []);

	const handleSelect = useCallback(
		(selectedValue: string) => {
			setInputValue(selectedValue);
			setActiveSuggestion(0);
			onSelect?.(selectedValue);
		},
		[onSelect],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLInputElement>) => {
			switch (e.key) {
				case 'Enter':
					e.preventDefault();
					if (filteredSuggestions[activeSuggestion]) {
						handleSelect(filteredSuggestions[activeSuggestion]);
					}
					break;
				case 'ArrowUp':
					e.preventDefault();
					setActiveSuggestion((prev) =>
						prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
					);
					break;
				case 'ArrowDown':
					e.preventDefault();
					setActiveSuggestion((prev) =>
						prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
					);
					break;
				case 'Escape':
					reset();
					inputRef.current?.blur();
					break;
			}
		},
		[filteredSuggestions, activeSuggestion, handleSelect, reset],
	);

	const handleSuggestionClick = useCallback(
		(suggestion: string) => {
			handleSelect(suggestion);
		},
		[handleSelect],
	);

	// Reset if clicked outside
	useEffect(() => {
		const [isOutside] = clickedOutside;
		if (isOutside) {
			reset();
		}
	}, [clickedOutside, reset]);

	// Render suggestions
	const renderSuggestions = () => {
		if (!filteredSuggestions.length) return null;

		return (
			<ul
				id={suggestionListId}
				ref={displayRef}
				className={styles.suggestions}
				role="listbox"
			>
				{filteredSuggestions.map((suggestion, index) => (
					<li
						key={suggestion}
						role="option"
						aria-selected={index === activeSuggestion}
						className={
							index === activeSuggestion
								? styles['suggestion-active']
								: undefined
						}
						onClick={() => handleSuggestionClick(suggestion)}
					>
						{suggestion}
					</li>
				))}
			</ul>
		);
	};

	return (
		<div className={styles['autocomplete-container']}>
			<div className={styles.center}>
				<button onClick={reset} type="button">
					Reset
				</button>
			</div>
			<label htmlFor={inputId}>Search Item:</label>
			<input
				ref={inputRef}
				id={inputId}
				name="autoCompleteInput"
				placeholder={placeholder}
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				onKeyDown={handleKeyDown}
				aria-autocomplete="list"
				aria-controls={suggestionListId}
				aria-activedescendant={
					filteredSuggestions[activeSuggestion]
						? `${suggestionListId}-${activeSuggestion}`
						: undefined
				}
			/>
			{renderSuggestions()}
		</div>
	);
};

export default React.memo(AutoComplete);
