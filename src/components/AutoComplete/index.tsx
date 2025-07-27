import {
	useState,
	useRef,
	useCallback,
	useEffect,
	useMemo,
	RefObject,
	ChangeEvent,
} from 'react';
import Portal from '../Common/Portal';
import { dbounce } from '../../utils/dbounce';
import { useClickOutside } from '../../hooks/EventListeners';
import { useSearchParams } from '../../hooks/useSearchParams';

const url: string = 'https://autocomplete.clearbit.com/v1/companies/suggest?query=';

const delay: number = 500;

interface Item {
	name: string;
	logo: string;
	domain: string;
}

export default function AutoComplete() {
	const [text, setText] = useState<string>('');
	const [items, setItems] = useState<Item[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
	const [currentItem, setCurrentItem] = useState<Item | null>(null);

	const modalContainerRef = useRef<RefObject<HTMLDivElement>>(null);
	const searchCacheRef = useRef<Record<string, Item[]>>({});
	const timoeutId = useRef<NodeJS.Timeout>(null);

	const { searchParams, updateParams } = useSearchParams();

	const { isOutsideClick, outsideRef } = useClickOutside<HTMLUListElement | HTMLDivElement>(
		false,
		'mousedown',
	);

	const fetchData = useCallback(async (searchText: string) => {
		if (searchText.length === 0) return;

		try {
			setIsLoading(true);

			if (searchText in searchCacheRef.current) {
				setItems(() => {
					setIsLoading(false);
					return searchCacheRef.current[searchText];
				});
				return;
			}

			updateParams({ searchText });

			const result = await fetch(`${url}${searchText}`);
			const data: Item[] = await result.json();
			searchCacheRef.current[searchText] = data;
			setItems(data);
		} catch (err) {
			console.log(err);
		} finally {
			setIsLoading(false);
		}
	}, []);

	//const debouncedFetchData = useMemo(() => dbounce(fetchData, delay), [fetchData]);
	const debouncedFetchData = useCallback((searchText: string) => {
		if (timoeutId.current) {
			clearTimeout(timoeutId.current);
			timoeutId.current = null;
		}

		timoeutId.current = setTimeout(() => fetchData(searchText), 300);
	}, [fetchData]);

	const handleChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			const searchText = e.target.value || '';
			setText(searchText);

			if (searchText?.length > 0) {
				debouncedFetchData(searchText.toLowerCase());
			} else {
				updateParams({ searchText: '' });
				setItems([]);
				closeModal();
			}
		},
		[debouncedFetchData],
	);

	const handleClick = (index: number) => {
		setCurrentItem(items[index]);
		setIsModalOpen(true);
	};

	const handleClear = () => {
		setText('');
		setItems([]);
		closeModal();
		updateParams({ searchText: '' });
	};

	// Close modal handler
	const closeModal = () => {
		setIsModalOpen(false);
		setCurrentItem(null);
	};

	useEffect(() => {
		const searchText = searchParams.get('searchText') || '';
		setText(searchText);
		debouncedFetchData(searchText);
	}, []);

	useEffect(() => {
		if (isOutsideClick) {
			if (!isModalOpen) {
				setItems([]);
			}
			closeModal();
		}
	}, [isOutsideClick]);

	const handlePageReload = (e: any) => {
		console.log('page reloaded on event', e);
	};

	useEffect(() => {
		window.addEventListener('beforeunload', handlePageReload);
		return () => {
			window.removeEventListener('beforeunload', handlePageReload);
		};
	});

	return (
		<>
			<div>
				<input type="text" value={text} onChange={handleChange} />{' '}
				<button
					onClick={handleClear}
					//className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
					className="h-[48px] bg-blue-300 w-[70px] grow items-center justify-center gap-2 rounded-md p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3"
				>
					<span className="sr-only text-black">Clear</span>
				</button>
				{isLoading && <div className="loading-indicator">Loading...</div>}
				{!isLoading && !isModalOpen ? (
					<ul ref={outsideRef}>
						{items?.length > 0 ? (
							items?.map(({ name, logo }, index) => (
								<li key={index} onClick={() => handleClick(index)}>
									{name} <img src={logo} alt={name} />
								</li>
							))
						) : text.length > 0 ? (
							<li className="no-results">No results found</li>
						) : null}
					</ul>
				) : null}
				{isModalOpen && modalContainerRef.current ? (
					<Portal container={modalContainerRef.current}>
						<div className="modal-content" ref={outsideRef}>
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
