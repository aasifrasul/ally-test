class BrowserHistory {
	constructor(initialState = null, title = '', url = window.location.href) {
		this.states = [initialState];
		this.urls = [url];
		this.titles = [title];
		this.currentIndex = 0;

		// Set up event listener for popstate
		window.addEventListener('popstate', this.handlePopState.bind(this));
	}

	// Add new state to history stack
	pushState(state, title, url) {
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
	replaceState(state, title, url) {
		this.states[this.currentIndex] = state;
		this.urls[this.currentIndex] = url;
		this.titles[this.currentIndex] = title;

		// Update browser's history
		window.history.replaceState(state, title, url);

		return this.currentState();
	}

	// Handle popstate events (browser back/forward buttons)
	handlePopState(event) {
		// Find the new index by matching state or URL
		const newUrl = window.location.href;
		let newIndex = this.urls.findIndex((url) => url === newUrl);

		if (newIndex === -1) {
			// If URL not found, try to match by state
			newIndex = this.states.findIndex(
				(state) => JSON.stringify(state) === JSON.stringify(event.state),
			);
		}

		if (newIndex !== -1) {
			this.currentIndex = newIndex;
		}

		// Dispatch a custom event that components can listen to
		const customEvent = new CustomEvent('historychange', {
			detail: {
				state: this.currentState().state,
				url: this.currentState().url,
				title: this.currentState().title,
			},
		});
		window.dispatchEvent(customEvent);
	}

	// Navigate backward
	back() {
		if (this.currentIndex > 0) {
			window.history.back();
			// The actual index update will happen in the popstate handler
		}
		return this.currentState();
	}

	// Navigate forward
	forward() {
		if (this.currentIndex < this.states.length - 1) {
			window.history.forward();
			// The actual index update will happen in the popstate handler
		}
		return this.currentState();
	}

	// Get current state information
	currentState() {
		return {
			state: this.states[this.currentIndex],
			url: this.urls[this.currentIndex],
			title: this.titles[this.currentIndex],
		};
	}

	// Clean up when no longer needed
	destroy() {
		window.removeEventListener('popstate', this.handlePopState);
	}
}
