import { ImageService } from '../ImageService';
import { createLogger, LogLevel } from '../../utils/logger';

jest.mock('../../utils/logger');

describe('ImageService', () => {
	let imageService: ImageService;
	let originalFetch: typeof global.fetch;

	beforeAll(() => {
		originalFetch = global.fetch;
	});

	beforeEach(() => {
		imageService = ImageService.getInstance();
		global.fetch = jest.fn();
		(createLogger as jest.Mock).mockReturnValue({
			debug: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
		});
	});

	afterEach(() => {
		global.fetch = originalFetch;
		jest.useRealTimers();
	});

	afterAll(() => {
		global.fetch = originalFetch;
	});

	describe('load', () => {
		it('should load an image successfully', async () => {
			const url = 'https://example.com/image.jpg';
			const mockResponse = {
				status: 200,
				headers: { 'Content-Type': 'image/jpeg' },
			};

			(global.fetch as jest.Mock).mockResolvedValue(mockResponse);

			const result = await imageService.load(url);

			expect(result).toBe('image data');
			expect(global.fetch).toHaveBeenCalledWith(url);
		});

		it('should retry on failure', async () => {
			jest.useFakeTimers();
			(global.fetch as jest.Mock)
				.mockRejectedValueOnce(new Error('Network error'))
				.mockResolvedValueOnce({
					ok: true,
					blob: jest
						.fn()
						.mockResolvedValue(
							new Blob(['fake image data'], { type: 'image/jpeg' }),
						),
				});

			const loadPromise = imageService.load('https://example.com/image.jpg');
			jest.advanceTimersByTime(1000);
			await loadPromise;

			expect(global.fetch).toHaveBeenCalledTimes(2);
		});

		it('should throw an error after max retries', async () => {
			jest.useFakeTimers();
			(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

			await expect(imageService.load('https://example.com/image.jpg')).rejects.toThrow(
				'Network error',
			);
			expect(global.fetch).toHaveBeenCalledTimes(3);
		});

		it('should abort the request on timeout', async () => {
			jest.useFakeTimers();
			(global.fetch as jest.Mock).mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 40000)),
			);

			const loadPromise = imageService.load('https://example.com/image.jpg', {
				timeout: 1000,
			});
			jest.advanceTimersByTime(1000);

			await expect(loadPromise).rejects.toThrow('aborted');
		});
	});

	describe('loadMultiple', () => {
		it('should load multiple images', async () => {
			const mockBlob = new Blob(['fake image data'], { type: 'image/jpeg' });
			const mockResponse = { ok: true, blob: jest.fn().mockResolvedValue(mockBlob) };
			(global.fetch as jest.Mock).mockResolvedValue(mockResponse);

			const urls = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'];
			const results = await imageService.loadMultiple(urls);

			expect(results).toHaveLength(2);
			expect(results[0]).toMatch(/^blob:/);
			expect(results[1]).toMatch(/^blob:/);
			expect(global.fetch).toHaveBeenCalledTimes(2);
		});

		it('should handle partial failures', async () => {
			const mockBlob = new Blob(['fake image data'], { type: 'image/jpeg' });
			(global.fetch as jest.Mock)
				.mockResolvedValueOnce({
					ok: true,
					blob: jest.fn().mockResolvedValue(mockBlob),
				})
				.mockRejectedValueOnce(new Error('Network error'));

			const urls = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'];
			const results = await imageService.loadMultiple(urls);

			expect(results).toHaveLength(1);
			expect(results[0]).toMatch(/^blob:/);
			expect(global.fetch).toHaveBeenCalledTimes(2);
		});
	});

	describe('revokeObjectURL', () => {
		it('should revoke object URL', () => {
			const mockRevoke = jest.fn();
			global.URL.revokeObjectURL = mockRevoke;

			imageService.revokeObjectURL('blob:https://example.com/1234-5678');

			expect(mockRevoke).toHaveBeenCalledWith('blob:https://example.com/1234-5678');
		});

		it('should handle errors when revoking', () => {
			const mockRevoke = jest.fn().mockImplementation(() => {
				throw new Error('Revoke error');
			});
			global.URL.revokeObjectURL = mockRevoke;

			imageService.revokeObjectURL('blob:https://example.com/1234-5678');

			expect(mockRevoke).toHaveBeenCalledWith('blob:https://example.com/1234-5678');
		});
	});

	describe('revokeMultipleObjectURLs', () => {
		it('should revoke multiple object URLs', () => {
			const mockRevoke = jest.fn();
			global.URL.revokeObjectURL = mockRevoke;

			const urls = [
				'blob:https://example.com/1234-5678',
				'blob:https://example.com/8765-4321',
			];
			imageService.revokeMultipleObjectURLs(urls);

			expect(mockRevoke).toHaveBeenCalledTimes(2);
			expect(mockRevoke).toHaveBeenCalledWith('blob:https://example.com/1234-5678');
			expect(mockRevoke).toHaveBeenCalledWith('blob:https://example.com/8765-4321');
		});
	});
});
