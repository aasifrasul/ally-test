import { useEffect, useRef, useCallback } from 'react';

interface LazyImageOptions {
    src: string;
    placeholder?: string;
    rootMargin?: string;
    threshold?: number;
    onLoad?: () => void;
    onError?: (error: Error) => void;
}

export const useLazyImage = (options: LazyImageOptions) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadedRef = useRef(false);

    const loadImage = useCallback(async () => {
        if (!imgRef.current || loadedRef.current) return;

        const img = imgRef.current;
        loadedRef.current = true;

        try {
            // Create a new image to preload
            const imageLoader = new Image();

            await new Promise<void>((resolve, reject) => {
                imageLoader.onload = () => resolve();
                imageLoader.onerror = () =>
                    reject(new Error(`Failed to load: ${options.src}`));
                imageLoader.src = options.src;
            });

            // Once loaded, update the actual img element
            img.src = options.src;
            img.classList.remove('loading');
            options.onLoad?.();
        } catch (error) {
            console.error('Image loading failed:', error);
            options.onError?.(error as Error);
        }
    }, [options.src, options.onLoad, options.onError]);

    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;

        // Set initial placeholder
        if (options.placeholder) {
            img.src = options.placeholder;
            img.classList.add('loading');
        }

        // Create intersection observer
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        loadImage();
                        observerRef.current?.unobserve(img);
                    }
                });
            },
            {
                rootMargin: options.rootMargin || '50px',
                threshold: options.threshold || 0,
            },
        );

        observerRef.current.observe(img);

        return () => {
            observerRef.current?.disconnect();
            loadedRef.current = false;
        };
    }, [loadImage, options.rootMargin, options.threshold, options.placeholder]);

    return imgRef;
};
