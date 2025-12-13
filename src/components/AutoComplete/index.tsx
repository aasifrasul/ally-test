import { useState, useRef, useCallback, useEffect } from 'react';

import Portal from '../Common/Portal';
import { useClickOutside } from '../../hooks';
import { useSearchParams } from '../../hooks/useSearchParams';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';
import { fetchAPIData } from '../../utils/common';
import { useEventListener } from '../../hooks';
import { InputText } from '../Common/InputText';

const url: string = 'https://autocomplete.clearbit.com/v1/companies/suggest?query=';

const delay: number = 500;

interface Item {
	name: string;
	logo: string;
	domain: string;
}

export default function AutoComplete() {
	const [items, setItems] = useState<Item[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
	const [currentItem, setCurrentItem] = useState<Item | null>(null);

	const modalContainerRef = useRef<HTMLDivElement>(null);
	const searchCacheRef = useRef<Record<string, Item[]>>({});
	const searchTextRef = useRef<HTMLInputElement>(null);

	const { getParamByKey, updateParams } = useSearchParams();

	const handlePageReload = (e: any) => {
		console.log('page reloaded on event', e);
	};

	useEventListener('beforeunload', handlePageReload, window);

	// Separate refs for dropdown and modal
	const { isOutsideClick: isDropdownOutsideClick, outsideRef: dropdownRef } =
		useClickOutside<HTMLUListElement>(false, 'mousedown');

	const { isOutsideClick: isModalOutsideClick, outsideRef: modalRef } =
		useClickOutside<HTMLDivElement>(false, 'mousedown');

	const fetchData = useCallback(
		async (searchText: string): Promise<void> => {
			if (searchText.length === 0) return;

			setIsLoading(true);

			if (searchText in searchCacheRef.current) {
				setItems(() => {
					setIsLoading(false);
					return searchCacheRef.current[searchText];
				});
				return;
			}

			updateParams({ searchText });

			const result = await fetchAPIData(`${url}${searchText}`);
			if (!result.success) {
				console.log(result.error);
				return;
			}

			const data = result.data as Item[];
			searchCacheRef.current[searchText] = data;
			setItems(data);
			setIsLoading(false);
		},
		[updateParams],
	);

	const { debouncedCallback: debouncedFetchData, cancel } = useDebouncedCallback(
		fetchData,
		delay,
	);

	const handleChange = useCallback(
		(searchText: string) => {
			if (searchText?.length > 0) {
				debouncedFetchData(searchText.toLowerCase());
			} else {
				cancel();
				updateParams({ searchText: '' });
				setItems([]);
				closeModal();
			}
		},
		[debouncedFetchData, cancel, updateParams],
	);

	const handleClick = (index: number) => {
		setCurrentItem(items[index]);
		setIsModalOpen(true);
	};

	const handleClear = () => {
		searchTextRef.current = null;
		setItems([]);
		closeModal();
		updateParams({ searchText: '' });
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setCurrentItem(null);
	};

	useEffect(() => {
		const searchText = getParamByKey('searchText');
		searchTextRef.current = null;
		debouncedFetchData(searchText);
	}, []);

	// Handle outside clicks for dropdown
	useEffect(() => {
		if (isDropdownOutsideClick && !isModalOpen) {
			setItems([]);
		}
	}, [isDropdownOutsideClick, isModalOpen]);

	// Handle outside clicks for modal
	useEffect(() => {
		if (isModalOutsideClick) {
			closeModal();
		}
	}, [isModalOutsideClick]);

	return (
		<>
			<div>
				<InputText
					name="autoComplete"
					id="autoComplete"
					label="AutoComplete"
					ref={searchTextRef}
					clearable
					onChange={handleChange}
				/>
				<button
					onClick={handleClear}
					className="h-[48px] bg-blue-300 w-[70px] grow items-center justify-center gap-2 rounded-md p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3"
				>
					<span className="sr-only text-black">Clear</span>
				</button>
				{isLoading && <div className="loading-indicator">Loading...</div>}
				{!isLoading && !isModalOpen ? (
					<ul ref={dropdownRef}>
						{items?.length > 0 ? (
							items?.map(({ name, logo }, index) => (
								<li key={index} onClick={() => handleClick(index)}>
									{name} <img src={logo} alt={name} />
								</li>
							))
						) : searchTextRef.current ? (
							<li className="no-results">No results found</li>
						) : null}
					</ul>
				) : null}
				{isModalOpen && modalContainerRef.current ? (
					<Portal container={modalContainerRef.current}>
						<div className="modal-content" ref={modalRef}>
							<button onClick={closeModal} className="close-button">
								X
							</button>
							{currentItem ? (
								<div className="modal-body">
									{currentItem?.name}{' '}
									<img src={currentItem?.logo} alt={currentItem?.name} />
								</div>
							) : null}
						</div>
					</Portal>
				) : null}
			</div>
			<div
				ref={(instance) => {
					modalContainerRef.current = instance;
				}}
			></div>
		</>
	);
}
