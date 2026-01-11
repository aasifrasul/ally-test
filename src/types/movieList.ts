import { FetchNextPage } from './api';

export interface Movie_Item {
	adult: boolean;
	backdrop_path: string | null;
	genre_ids: number[];
	id: number;
	original_language: string;
	original_title: string;
	overview: string;
	popularity: number;
	poster_path: string | null;
	release_date: string; // Format: "YYYY-MM-DD"
	title: string;
	video: boolean;
	vote_average: number;
	vote_count: number;
}

export interface MovieResponseData {
	results: Movie_Item[];
	total_pages?: number;
	page?: number;
	total_results: number;
}

export interface MovieListProps {
	data?: Movie_Item[];
	fetchNextPage: FetchNextPage;
	schema: any;
}

export interface MovieProps {
	item: Movie_Item;
	styles: {
		[key: string]: string;
	};
}
