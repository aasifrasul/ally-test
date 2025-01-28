export interface NewsItem {
	title: string;
	description: string;
	author: string;
	publishedAt: string;
	urlToImage?: string; // Optional property
	url: string;
}

export interface ApiResponse {
	data: { articles: NewsItem[] };
	status: number;
}

export interface DispatchAction {
	type: string;
	payload: NewsItem[];
}
