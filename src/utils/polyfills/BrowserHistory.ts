// Type definitions for browser history state
type HistoryState = any; // Can be any serializable object

interface CurrentStateResult {
	state: HistoryState;
	url: string;
	title: string;
}

interface HistoryChangeEventDetail {
	state: HistoryState;
	url: string;
	title: string;
}

// Extend the global CustomEvent interface to include our custom event
declare global {
	interface WindowEventMap {
		historychange: CustomEvent<HistoryChangeEventDetail>;
	}
}

export class BrowserHistory {
	private states: HistoryState[];
	private urls: string[];
	private titles: string[];
	private currentIndex: number;

	constructor(
		initialState: HistoryState = null,
		title: string = '',
		url: string = window.location.href,
	) {
		this.states = [initialState];
		this.urls = [url];
		this.titles = [title];
		this.currentIndex = 0;

		// Set up event listener for popstate
		window.addEventListener('popstate', this.handlePopState.bind(this));
	}

	// Add new state to history stack
	pushState(state: HistoryState, title: string, url: string): CurrentStateResult {
		// Similar to native API - clear forward history when pushing new state
		this.states = this.states.slice(0, this.currentIndex + 1);
		this.urls = this.urls.slice(0, this.currentIndex + 1);
		this.titles = this.titles.slice(0, this.currentIndex + 1);

		// Push new entries
		this.states.push(state);
		this.urls.push(url);
		this.titles.push(title);
		this.currentIndex++;

		// Update browser's history
		window.history.pushState(state, title, url);

		return this.currentState();
	}

	// Replace current state in history
	replaceState(state: HistoryState, title: string, url: string): CurrentStateResult {
		this.states[this.currentIndex] = state;
		this.urls[this.currentIndex] = url;
		this.titles[this.currentIndex] = title;

		// Update browser's history
		window.history.replaceState(state, title, url);

		return this.currentState();
	}

	// Handle popstate events (browser back/forward buttons)
	private handlePopState(event: PopStateEvent): void {
		// Find the new index by matching state or URL
		const newUrl: string = window.location.href;
		let newIndex: number = this.urls.findIndex((url: string) => url === newUrl);

		if (newIndex === -1) {
			// If URL not found, try to match by state
			newIndex = this.states.findIndex(
				(state: HistoryState) => JSON.stringify(state) === JSON.stringify(event.state),
			);
		}

		if (newIndex !== -1) {
			this.currentIndex = newIndex;
		}

		const { state, url, title } = this.currentState();

		// Dispatch a custom event that components can listen to
		const customEvent: CustomEvent<HistoryChangeEventDetail> = new CustomEvent(
			'historychange',
			{ detail: { state, url, title } },
		);
		window.dispatchEvent(customEvent);
	}

	// Navigate backward
	back(): CurrentStateResult {
		if (this.currentIndex > 0) {
			window.history.back();
			// The actual index update will happen in the popstate handler
		}
		return this.currentState();
	}

	// Navigate forward
	forward(): CurrentStateResult {
		if (this.currentIndex < this.states.length - 1) {
			window.history.forward();
			// The actual index update will happen in the popstate handler
		}
		return this.currentState();
	}

	// Get current state information
	currentState(): CurrentStateResult {
		return {
			state: this.states[this.currentIndex],
			url: this.urls[this.currentIndex],
			title: this.titles[this.currentIndex],
		};
	}

	// Get history length
	get length(): number {
		return this.states.length;
	}

	// Get current index (read-only)
	get index(): number {
		return this.currentIndex;
	}

	// Check if we can go back
	canGoBack(): boolean {
		return this.currentIndex > 0;
	}

	// Check if we can go forward
	canGoForward(): boolean {
		return this.currentIndex < this.states.length - 1;
	}

	// Clean up when no longer needed
	destroy(): void {
		window.removeEventListener('popstate', this.handlePopState.bind(this));
	}
}

// Usage example with proper typing
interface AppState {
	page: string;
	filters?: Record<string, string>;
	userId?: number;
}
/*
// Example usage
const history = new BrowserHistory({ page: 'home' } as AppState, 'Home Page', '/home');

// Type-safe state management
const productState: AppState = {
	page: 'products',
	filters: { category: 'electronics', price: 'under-100' },
};

history.pushState(productState, 'Products', '/products');

// Event listener with proper typing
window.addEventListener('historychange', (event: CustomEvent<HistoryChangeEventDetail>) => {
	const { state, url, title } = event.detail;
	console.log('Navigation occurred:', { state, url, title });
});

export default BrowserHistory;
export type { HistoryState, CurrentStateResult, HistoryChangeEventDetail, AppState };
*/
