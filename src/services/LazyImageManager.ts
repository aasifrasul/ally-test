export class LazyImageManager {
	private static instance: LazyImageManager;
	private observers: Map<Element, IntersectionObserver> = new Map();
	private loadedImages: Set<Element> = new Set();

	private constructor() {}

	public static getInstance(): LazyImageManager {
		if (!LazyImageManager.instance) {
			LazyImageManager.instance = new LazyImageManager();
		}
		return LazyImageManager.instance;
	}

	observeImage(
		element: HTMLImageElement,
		actualSrc: string,
		options: {
			placeholder?: string;
			rootMargin?: string;
			threshold?: number;
			onLoad?: () => void;
			onError?: (error: Error) => void;
		} = {},
	) {
		if (this.loadedImages.has(element)) return;

		// Set placeholder
		if (options.placeholder) {
			element.src = options.placeholder;
			element.classList.add('loading');
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach(async (entry) => {
					if (entry.isIntersecting && !this.loadedImages.has(element)) {
						this.loadedImages.add(element);
						observer.unobserve(element);

						try {
							// Preload the image
							const img = new Image();
							await new Promise<void>((resolve, reject) => {
								img.onload = () => resolve();
								img.onerror = () =>
									reject(new Error(`Failed to load: ${actualSrc}`));
								img.src = actualSrc;
							});

							// Update the actual element
							element.src = actualSrc;
							element.classList.remove('loading');
							options.onLoad?.();
						} catch (error) {
							console.error('Lazy loading failed:', error);
							options.onError?.(error as Error);
						}
					}
				});
			},
			{
				rootMargin: options.rootMargin || '50px',
				threshold: options.threshold || 0,
			},
		);

		observer.observe(element);
		this.observers.set(element, observer);
	}

	unobserveImage(element: Element) {
		const observer = this.observers.get(element);
		if (observer) {
			observer.unobserve(element);
			this.observers.delete(element);
		}
		this.loadedImages.delete(element);
	}

	cleanup() {
		this.observers.forEach((observer) => observer.disconnect());
		this.observers.clear();
		this.loadedImages.clear();
	}
}
