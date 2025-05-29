// HTML5 Video Setup
// Define icons and playback speeds. These would typically be imported from a separate constants file.
/*
const ICONS = {
	PLAY: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
	PAUSE: '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
	VOLUME_HIGH: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM19 12c0 .94-.27 1.81-.74 2.53l1.45 1.45c.9-.99 1.45-2.3 1.45-3.98s-.55-2.99-1.45-3.98L18.26 9.47c.47.72.74 1.59.74 2.53z"/></svg>',
	VOLUME_LOW: '<svg viewBox="0 0 24 24"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>',
	VOLUME_MUTE: '<svg viewBox="0 0 24 24"><path d="M7 9v6h4l5 5V4l-5 5H7zm12.33-3.41c.65-.65 1.66-.65 2.31 0s.65 1.66 0 2.31L19.31 12l2.33 2.33c.65.65.65 1.66 0 2.31s-1.66.65-2.31 0L17 14.31l-2.33 2.33c-.65.65-1.66.65-2.31 0s-.65-1.66 0-2.31L14.69 12l-2.33-2.33c-.65-.65-.65-1.66 0-2.31s1.66-.65 2.31 0L17 9.69l2.33-2.33z"/></svg>',
	PIP: '<svg viewBox="0 0 24 24"><path d="M19 11h-8V7h8v4zm3-7H2C.9 4 0 4.9 0 6v12c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H2V6h20v12z"/></svg>',
	FULLSCREEN: '<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>'
};
*/
const ICONS = {
	PLAY: '▶',
	PAUSE: '⏸',
	VOLUME_HIGH: '🔊',
	VOLUME_LOW: '🔉',
	VOLUME_MUTE: '🔇',
	FULLSCREEN: '⛶',
	EXIT_FULLSCREEN: '⛶',
	SETTINGS: '⚙',
	PIP: '⧉',
	LOADING: '⏳',
};
const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SEEK_STEP = 5; // seconds
const VOLUME_STEP = 0.1; // volume increments

class VideoPlayer {
	private video!: HTMLVideoElement;
	private container!: HTMLElement;
	private controls!: HTMLDivElement;
	private currentTimeDisplay!: HTMLSpanElement;
	private progressBar!: HTMLInputElement;
	private bufferedBar!: HTMLDivElement;
	private durationDisplay!: HTMLSpanElement;
	private playPauseButton!: HTMLButtonElement;
	private muteButton!: HTMLButtonElement;
	private volumeControl!: HTMLInputElement;
	private speedButton!: HTMLButtonElement;
	private speedMenu!: HTMLDivElement;
	private pipButton: HTMLButtonElement | undefined; // Optional if PiP is not enabled
	private fullscreenButton!: HTMLButtonElement;
	private spinner!: HTMLDivElement;
	private errorOverlay!: HTMLDivElement;

	private isControlsVisible: boolean = false;
	private controlsHideTimeout: number | null = null;
	private isSeeking: boolean = false;
	private lastPlaybackSpeed: number = 1;

	constructor(videoElement: HTMLVideoElement, containerElement: HTMLElement) {
		if (!(videoElement instanceof HTMLVideoElement)) {
			console.error('Invalid video element provided.');
			return; // Or throw an error
		}
		if (!(containerElement instanceof HTMLElement)) {
			console.error('Invalid container element provided.');
			return; // Or throw an error
		}

		this.video = videoElement;
		this.container = containerElement;

		this.initializePlayer();
		this.createUI();
		this.setupEventListeners();
		this.setupKeyboardControls();
		this.setupTouchControls();
	}

	private initializePlayer(): void {
		this.video.preload = 'metadata';
		this.video.crossOrigin = 'anonymous';
		this.video.setAttribute('playsinline', '');
		this.video.setAttribute('webkit-playsinline', '');
		this.video.volume = 0.5;
		this.video.controls = false;

		// Add ARIA labels for accessibility
		this.video.setAttribute('role', 'application');
		this.video.setAttribute('aria-label', 'Video player');
	}

	private createUI(): void {
		// Create controls container
		this.controls = document.createElement('div');
		this.controls.className = 'video-controls';
		this.controls.setAttribute('role', 'toolbar');
		this.controls.setAttribute('aria-label', 'Video controls');

		// Progress container
		const progressContainer = document.createElement('div');
		progressContainer.className = 'progress-container';

		// Current time
		this.currentTimeDisplay = document.createElement('span');
		this.currentTimeDisplay.className = 'time-display';
		this.currentTimeDisplay.textContent = '0:00';
		this.currentTimeDisplay.setAttribute('aria-label', 'Current time');

		// Progress bar
		this.progressBar = document.createElement('input');
		this.progressBar.type = 'range';
		this.progressBar.min = '0';
		this.progressBar.value = '0';
		this.progressBar.className = 'progress-bar';
		this.progressBar.setAttribute('aria-label', 'Video progress');
		this.progressBar.setAttribute('role', 'slider');

		// Buffered indicator
		this.bufferedBar = document.createElement('div');
		this.bufferedBar.className = 'buffered-bar';
		this.progressBar.appendChild(this.bufferedBar); // Append buffered bar to progress bar for overlay effect

		// Duration
		this.durationDisplay = document.createElement('span');
		this.durationDisplay.className = 'time-display';
		this.durationDisplay.textContent = '0:00';
		this.durationDisplay.setAttribute('aria-label', 'Duration');

		progressContainer.appendChild(this.currentTimeDisplay);
		progressContainer.appendChild(this.progressBar);
		progressContainer.appendChild(this.durationDisplay);

		// Controls row
		const controlsRow = document.createElement('div');
		controlsRow.className = 'controls-row';

		// Left controls
		const controlsLeft = document.createElement('div');
		controlsLeft.className = 'controls-left';

		// Play/Pause button
		this.playPauseButton = document.createElement('button');
		this.playPauseButton.className = 'control-button play-pause-button';
		this.playPauseButton.innerHTML = ICONS.PLAY;
		this.playPauseButton.setAttribute('aria-label', 'Play video');

		controlsLeft.appendChild(this.playPauseButton);

		// Right controls
		const controlsRight = document.createElement('div');
		controlsRight.className = 'controls-right';

		// Volume container
		const volumeContainer = document.createElement('div');
		volumeContainer.className = 'volume-container';

		// Mute button
		this.muteButton = document.createElement('button');
		this.muteButton.className = 'control-button';
		this.muteButton.innerHTML = ICONS.VOLUME_HIGH;
		this.muteButton.setAttribute('aria-label', 'Mute');

		// Volume control
		this.volumeControl = document.createElement('input');
		this.volumeControl.type = 'range';
		this.volumeControl.min = '0';
		this.volumeControl.max = '1';
		this.volumeControl.step = '0.01';
		this.volumeControl.value = String(this.video.volume);
		this.volumeControl.className = 'volume-control';
		this.volumeControl.setAttribute('aria-label', 'Volume');

		volumeContainer.appendChild(this.muteButton);
		volumeContainer.appendChild(this.volumeControl);

		// Speed button
		this.speedButton = document.createElement('button');
		this.speedButton.className = 'control-button';
		this.speedButton.textContent = '1×';
		this.speedButton.setAttribute('aria-label', 'Playback speed');

		// Speed menu
		this.speedMenu = document.createElement('div');
		this.speedMenu.className = 'speed-menu';
		PLAYBACK_SPEEDS.forEach((speed) => {
			const option = document.createElement('button');
			option.className = 'speed-option';
			option.textContent = `${speed}×`;
			option.dataset.speed = String(speed); // dataset values are strings
			if (speed === 1) option.classList.add('active');
			this.speedMenu.appendChild(option);
		});

		// Picture-in-Picture button
		if (document.pictureInPictureEnabled) {
			this.pipButton = document.createElement('button');
			this.pipButton.className = 'control-button';
			this.pipButton.innerHTML = ICONS.PIP;
			this.pipButton.setAttribute('aria-label', 'Picture in picture');
			controlsRight.appendChild(this.pipButton);
		}

		// Fullscreen button
		this.fullscreenButton = document.createElement('button');
		this.fullscreenButton.className = 'control-button';
		this.fullscreenButton.innerHTML = ICONS.FULLSCREEN;
		this.fullscreenButton.setAttribute('aria-label', 'Fullscreen');

		controlsRight.appendChild(volumeContainer);
		controlsRight.appendChild(this.speedButton);
		controlsRight.appendChild(this.fullscreenButton);

		controlsRow.appendChild(controlsLeft);
		controlsRow.appendChild(controlsRight);

		this.controls.appendChild(progressContainer);
		this.controls.appendChild(controlsRow);

		// Spinner
		this.spinner = document.createElement('div');
		this.spinner.className = 'video-spinner';

		// Error overlay
		this.errorOverlay = document.createElement('div');
		this.errorOverlay.className = 'error-overlay';
		this.errorOverlay.innerHTML = `
            <div class="error-icon">⚠</div>
            <div class="error-message">An error occurred while loading the video.</div>
            <button class="retry-button">Retry</button>
        `;

		// Append to container
		this.container.appendChild(this.controls);
		this.container.appendChild(this.speedMenu);
		this.container.appendChild(this.spinner);
		this.container.appendChild(this.errorOverlay);
	}

	private setupEventListeners(): void {
		// Video events
		this.video.addEventListener('loadedmetadata', this.onMetadataLoaded.bind(this));
		this.video.addEventListener('timeupdate', this.onTimeUpdate.bind(this));
		this.video.addEventListener('progress', this.onProgress.bind(this));
		this.video.addEventListener('waiting', this.onBuffering.bind(this));
		this.video.addEventListener('canplay', this.onCanPlay.bind(this));
		this.video.addEventListener('play', this.onPlay.bind(this));
		this.video.addEventListener('pause', this.onPause.bind(this));
		this.video.addEventListener('ended', this.onEnded.bind(this));
		this.video.addEventListener('volumechange', this.onVolumeChange.bind(this));
		this.video.addEventListener('error', this.onError.bind(this));
		this.video.addEventListener('ratechange', this.onRateChange.bind(this));

		// Control events
		this.playPauseButton.addEventListener('click', this.togglePlayPause.bind(this));
		this.progressBar.addEventListener('input', this.onProgressInput.bind(this));
		this.progressBar.addEventListener('change', this.onProgressChange.bind(this));
		this.progressBar.addEventListener('mousedown', () => (this.isSeeking = true));
		this.progressBar.addEventListener('mouseup', () => (this.isSeeking = false));
		this.volumeControl.addEventListener('input', this.onVolumeInput.bind(this));
		this.muteButton.addEventListener('click', this.toggleMute.bind(this));
		this.speedButton.addEventListener('click', this.toggleSpeedMenu.bind(this));
		this.fullscreenButton.addEventListener('click', this.toggleFullscreen.bind(this));

		if (this.pipButton) {
			this.pipButton.addEventListener('click', this.togglePictureInPicture.bind(this));
			this.video.addEventListener('enterpictureinpicture', this.onEnterPiP.bind(this));
			this.video.addEventListener('leavepictureinpicture', this.onLeavePiP.bind(this));
		}

		// Speed menu events
		this.speedMenu.addEventListener('click', this.onSpeedSelect.bind(this));

		// Container events for controls visibility
		this.container.addEventListener('mouseenter', this.showControls.bind(this));
		this.container.addEventListener('mouseleave', this.hideControlsDelayed.bind(this));
		this.container.addEventListener('mousemove', this.showControls.bind(this));
		this.container.addEventListener('click', this.onContainerClick.bind(this));

		// Fullscreen events
		document.addEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
		document.addEventListener(
			'webkitfullscreenchange',
			this.onFullscreenChange.bind(this),
		);
		document.addEventListener('mozfullscreenchange', this.onFullscreenChange.bind(this));
		document.addEventListener('MSFullscreenChange', this.onFullscreenChange.bind(this));

		// Click outside to close menus
		document.addEventListener('click', this.onDocumentClick.bind(this));

		// Error overlay retry
		this.errorOverlay
			.querySelector('.retry-button')
			?.addEventListener('click', this.retryLoad.bind(this));
	}

	private setupKeyboardControls(): void {
		this.container.setAttribute('tabindex', '0');
		this.container.addEventListener('keydown', (e: KeyboardEvent) => {
			// Prevent default for handled keys
			const handledKeys = [
				'Space',
				'ArrowLeft',
				'ArrowRight',
				'ArrowUp',
				'ArrowDown',
				'KeyM',
				'KeyF',
				'Home',
				'End',
			];
			if (handledKeys.includes(e.code)) {
				e.preventDefault();
			}

			switch (e.code) {
				case 'Space':
					this.togglePlayPause();
					break;
				case 'ArrowLeft':
					this.seekRelative(-SEEK_STEP);
					break;
				case 'ArrowRight':
					this.seekRelative(SEEK_STEP);
					break;
				case 'ArrowUp':
					this.adjustVolume(VOLUME_STEP);
					break;
				case 'ArrowDown':
					this.adjustVolume(-VOLUME_STEP);
					break;
				case 'KeyM':
					this.toggleMute();
					break;
				case 'KeyF':
					this.toggleFullscreen();
					break;
				case 'Home':
					this.video.currentTime = 0;
					break;
				case 'End':
					this.video.currentTime = this.video.duration;
					break;
			}
		});
	}

	private setupTouchControls(): void {
		let touchStartX = 0;
		let touchStartY = 0;
		let touchStartTime = 0;
		let touchStartVolume = 0;

		this.container.addEventListener(
			'touchstart',
			(e: TouchEvent) => {
				if (e.touches.length === 1) {
					touchStartX = e.touches[0].clientX;
					touchStartY = e.touches[0].clientY;
					touchStartTime = this.video.currentTime;
					touchStartVolume = this.video.volume;
				}
			},
			{ passive: true },
		);

		this.container.addEventListener(
			'touchmove',
			(e: TouchEvent) => {
				if (e.touches.length === 1) {
					const deltaX = e.touches[0].clientX - touchStartX;
					const deltaY = e.touches[0].clientY - touchStartY;
					const rect = this.container.getBoundingClientRect();

					// Horizontal swipe for seeking
					if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
						const seekAmount = (deltaX / rect.width) * 30; // Max 30 seconds
						const newTime = Math.max(
							0,
							Math.min(this.video.duration, touchStartTime + seekAmount),
						);
						this.video.currentTime = newTime;
					}

					// Vertical swipe for volume (right side of screen)
					if (
						Math.abs(deltaY) > Math.abs(deltaX) &&
						Math.abs(deltaY) > 20 &&
						touchStartX > rect.width / 2
					) {
						const volumeChange = -(deltaY / rect.height);
						const newVolume = Math.max(
							0,
							Math.min(1, touchStartVolume + volumeChange),
						);
						this.video.volume = newVolume;
					}
				}
			},
			{ passive: true },
		);

		// Show controls on touch
		this.container.addEventListener('touchend', () => {
			this.showControls();
			this.hideControlsDelayed();
		});
	}

	// Event handlers
	private onMetadataLoaded(): void {
		this.progressBar.max = String(this.video.duration);
		this.durationDisplay.textContent = this.formatTime(this.video.duration);
	}

	private onTimeUpdate(): void {
		if (!this.isSeeking) {
			this.progressBar.value = String(this.video.currentTime);
		}
		this.currentTimeDisplay.textContent = this.formatTime(this.video.currentTime);
	}

	private onProgress(): void {
		if (this.video.buffered.length > 0) {
			const bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
			const duration = this.video.duration;
			if (duration > 0) {
				const bufferedPercent = (bufferedEnd / duration) * 100;
				this.bufferedBar.style.width = `${bufferedPercent}%`;
			}
		}
	}

	private onBuffering(): void {
		this.showSpinner();
	}

	private onCanPlay(): void {
		this.hideSpinner();
	}

	private onPlay(): void {
		this.playPauseButton.innerHTML = ICONS.PAUSE;
		this.playPauseButton.setAttribute('aria-label', 'Pause video');
		this.container.classList.add('playing');
		this.container.classList.remove('paused');
	}

	private onPause(): void {
		this.playPauseButton.innerHTML = ICONS.PLAY;
		this.playPauseButton.setAttribute('aria-label', 'Play video');
		this.container.classList.remove('playing');
		this.container.classList.add('paused');
	}

	private onEnded(): void {
		this.playPauseButton.innerHTML = ICONS.PLAY;
		this.playPauseButton.setAttribute('aria-label', 'Play video');
		this.container.classList.remove('playing');
		this.container.classList.add('paused');
		this.showControls();
	}

	private onVolumeChange(): void {
		this.volumeControl.value = String(this.video.volume);
		const isMuted = this.video.muted || this.video.volume === 0;

		if (isMuted) {
			this.muteButton.innerHTML = ICONS.VOLUME_MUTE;
			this.muteButton.setAttribute('aria-label', 'Unmute');
		} else if (this.video.volume < 0.5) {
			this.muteButton.innerHTML = ICONS.VOLUME_LOW;
			this.muteButton.setAttribute('aria-label', 'Mute');
		} else {
			this.muteButton.innerHTML = ICONS.VOLUME_HIGH;
			this.muteButton.setAttribute('aria-label', 'Mute');
		}
	}

	private onRateChange(): void {
		this.speedButton.textContent = `${this.video.playbackRate}×`;
		// Update active speed in menu
		this.speedMenu.querySelectorAll('.speed-option').forEach((option) => {
			option.classList.toggle(
				'active',
				parseFloat(option.dataset.speed || '1') === this.video.playbackRate,
			);
		});
	}

	private onError(event: Event): void {
		const videoError = (event.target as HTMLVideoElement).error;
		let errorMessage = 'An unknown video error occurred.';

		if (videoError) {
			switch (videoError.code) {
				case MediaError.MEDIA_ERR_ABORTED:
					errorMessage = 'Video playback was aborted.';
					break;
				case MediaError.MEDIA_ERR_NETWORK:
					errorMessage = 'A network error caused the video download to fail.';
					break;
				case MediaError.MEDIA_ERR_DECODE:
					errorMessage =
						'The video playback was aborted due to a corruption problem or unsupported features.';
					break;
				case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
					errorMessage = 'The video format is not supported by your browser.';
					break;
				default:
					errorMessage = `An unknown error occurred (Code: ${videoError.code}).`;
			}
		}

		this.showError(errorMessage);
		console.error('Video Error:', errorMessage, videoError);
	}

	private onEnterPiP(): void {
		this.pipButton?.setAttribute('aria-label', 'Exit picture in picture');
	}

	private onLeavePiP(): void {
		this.pipButton?.setAttribute('aria-label', 'Picture in picture');
	}

	private onFullscreenChange(): void {
		const isFullscreen = document.fullscreenElement === this.container;
		this.container.classList.toggle('fullscreen', isFullscreen);
		this.fullscreenButton.setAttribute(
			'aria-label',
			isFullscreen ? 'Exit fullscreen' : 'Fullscreen',
		);
	}

	// Control handlers
	private togglePlayPause(): void {
		if (this.video.paused || this.video.ended) {
			this.video.play().catch((e) => console.error('Play failed:', e));
		} else {
			this.video.pause();
		}
	}

	private onProgressInput(): void {
		this.currentTimeDisplay.textContent = this.formatTime(
			parseFloat(this.progressBar.value),
		);
	}

	private onProgressChange(): void {
		this.video.currentTime = parseFloat(this.progressBar.value);
	}

	private onVolumeInput(): void {
		this.video.volume = parseFloat(this.volumeControl.value);
		if (this.video.muted) {
			this.video.muted = false;
		}
	}

	private toggleMute(): void {
		this.video.muted = !this.video.muted;
	}

	private toggleSpeedMenu(): void {
		const isVisible = this.speedMenu.style.display === 'block';
		this.speedMenu.style.display = isVisible ? 'none' : 'block';
	}

	private onSpeedSelect(event: MouseEvent): void {
		const target = event.target as HTMLElement;
		if (target.classList.contains('speed-option')) {
			const speed = parseFloat(target.dataset.speed || '1'); // Default to 1 if not found
			this.video.playbackRate = speed;
			this.speedMenu.style.display = 'none';
		}
	}

	private togglePictureInPicture(): void {
		if (!this.pipButton) return; // Ensure button exists

		if (document.pictureInPictureElement) {
			document.exitPictureInPicture().catch((e) => console.error('PiP exit failed:', e));
		} else {
			this.video.requestPictureInPicture().catch((e) => console.error('PiP failed:', e));
		}
	}

	private toggleFullscreen(): void {
		if (document.fullscreenElement) {
			document
				.exitFullscreen()
				.catch((e) => console.error('Exit fullscreen failed:', e));
		} else {
			// Use type assertion for cross-browser compatibility
			const requestFullscreen =
				(this.container as any).requestFullscreen ||
				(this.container as any).webkitRequestFullscreen ||
				(this.container as any).mozRequestFullScreen ||
				(this.container as any).msRequestFullscreen;
			if (requestFullscreen) {
				requestFullscreen
					.call(this.container)
					.catch((e: Error) => console.error('Fullscreen failed:', e));
			}
		}
	}

	private onContainerClick(event: MouseEvent): void {
		// Toggle play/pause when clicking on video area (not controls)
		if (event.target === this.video || event.target === this.container) {
			this.togglePlayPause();
		}
	}

	private onDocumentClick(event: MouseEvent): void {
		// Close menus when clicking outside
		if (
			!this.speedMenu.contains(event.target as Node) &&
			event.target !== this.speedButton
		) {
			this.speedMenu.style.display = 'none';
		}
	}

	// Helper methods
	private seekRelative(seconds: number): void {
		const newTime = Math.max(
			0,
			Math.min(this.video.duration, this.video.currentTime + seconds),
		);
		this.video.currentTime = newTime;
		this.showControls();
	}

	private adjustVolume(delta: number): void {
		const newVolume = Math.max(0, Math.min(1, this.video.volume + delta));
		this.video.volume = newVolume;
		if (this.video.muted) {
			this.video.muted = false;
		}
		this.showControls();
	}

	private showControls(): void {
		this.container.classList.add('controls-visible');
		this.isControlsVisible = true;
		this.clearControlsTimeout();
	}

	private hideControlsDelayed(): void {
		this.clearControlsTimeout();
		if (!this.video.paused) {
			this.controlsHideTimeout = setTimeout(() => {
				this.container.classList.remove('controls-visible');
				this.isControlsVisible = false;
			}, 3000);
		}
	}

	private clearControlsTimeout(): void {
		if (this.controlsHideTimeout) {
			clearTimeout(this.controlsHideTimeout);
			this.controlsHideTimeout = null;
		}
	}

	private showSpinner(): void {
		this.spinner.style.display = 'block';
	}

	private hideSpinner(): void {
		this.spinner.style.display = 'none';
	}

	private showError(message: string): void {
		const errorMessageElement = this.errorOverlay.querySelector('.error-message');
		if (errorMessageElement) {
			errorMessageElement.textContent = message;
		}
		this.errorOverlay.style.display = 'flex';
		this.hideSpinner();
	}

	private hideError(): void {
		this.errorOverlay.style.display = 'none';
	}

	private retryLoad(): void {
		this.hideError();
		this.video.load();
	}

	private formatTime(seconds: number): string {
		if (isNaN(seconds)) return '0:00';

		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = Math.floor(seconds % 60);

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	}

	// Public API
	public loadSource(src: string, type: string = 'video/mp4'): void {
		this.hideError();
		this.video.src = src;
		this.video.load();
		this.video.currentTime = 0;
		this.progressBar.value = '0';
		this.currentTimeDisplay.textContent = '0:00';
		this.durationDisplay.textContent = '0:00';
		console.log(`Loading new video source: ${src}`);
	}

	public play(): Promise<void> {
		return this.video.play();
	}

	public pause(): void {
		this.video.pause();
	}

	public setVolume(volume: number): void {
		this.video.volume = Math.max(0, Math.min(1, volume));
	}

	public setPlaybackSpeed(speed: number): void {
		if (PLAYBACK_SPEEDS.includes(speed)) {
			this.video.playbackRate = speed;
		}
	}

	public getCurrentTime(): number {
		return this.video.currentTime;
	}

	public getDuration(): number {
		return this.video.duration;
	}

	public isPlaying(): boolean {
		return !this.video.paused && !this.video.ended;
	}

	public destroy(): void {
		this.clearControlsTimeout();
		// A more robust destroy method would remove all event listeners
		// to prevent memory leaks, especially important for long-lived applications.
		// For example:
		// this.video.removeEventListener('loadedmetadata', this.onMetadataLoadedBound);
		// ... and so on for all event listeners.
		// This requires storing the bound functions in class properties.
	}
}

// Example Usage (in your HTML)
/**
<div id="videoContainer" class="video-player-container">
	<video id="myVideo" src="your-video-file.mp4"></video>
</div>

<style>
	.video-player-container {
		position: relative;
		width: 100%;
		max-width: 800px;
		margin: auto;
		background - color: black;
		overflow: hidden;
	}

	.video - player - container video {
		width: 100 %;
		height: auto;
		display: block;
	}

	.video - controls {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background: rgba(0, 0, 0, 0.7);
	padding: 10px;
	display: flex;
	align - items: center;
	gap: 10px;
	color: white;
	transition: opacity 0.3s ease;
	opacity: 0;
}

	.video - player - container: hover.video - controls,
	.video - player - container.playing.video - controls.active {
	opacity: 1;
}

	.video - controls button {
	background: none;
	border: none;
	color: white;
	font - size: 1.5em;
	cursor: pointer;
	padding: 5px;
	transition: color 0.2s;
}

	.video - controls button:hover {
	color: lightgray;
}

	.video - controls.progress - bar {
	flex - grow: 1;
	-webkit - appearance: none;
	height: 8px;
	background: rgba(255, 255, 255, 0.3);
	border - radius: 5px;
	cursor: pointer;
}

	.video - controls.progress - bar:: -webkit - slider - thumb {
	-webkit - appearance: none;
	width: 15px;
	height: 15px;
	border - radius: 50 %;
	background: #007bff;
	cursor: grab;
}

	.video - controls.volume - control {
	width: 80px;
	-webkit - appearance: none;
	height: 5px;
	background: rgba(255, 255, 255, 0.3);
	border - radius: 5px;
	cursor: pointer;
}

	.video - controls.volume - control:: -webkit - slider - thumb {
	-webkit - appearance: none;
	width: 12px;
	height: 12px;
	border - radius: 50 %;
	background: #007bff;
	cursor: grab;
}

	.video - spinner {
	position: absolute;
	top: 50 %;
	left: 50 %;
	transform: translate(-50 %, -50 %);
	border: 4px solid rgba(255, 255, 255, 0.3);
	border - top: 4px solid #007bff;
	border - radius: 50 %;
	width: 40px;
	height: 40px;
	animation: spin 1s linear infinite;
	z - index: 10;
}

@keyframes spin {
	0 % { transform: translate(-50 %, -50 %) rotate(0deg); }
	100 % { transform: translate(-50 %, -50 %) rotate(360deg); }
}

	.video - player - container.fullscreen {
	width: 100vw;
	height: 100vh;
	max - width: none;
	position: fixed;
	top: 0;
	left: 0;
	z - index: 9999;
}
</style>

	<script>
document.addEventListener('DOMContentLoaded', () => {
	const videoElement = document.getElementById('myVideo') as HTMLVideoElement;
	const videoContainer = document.getElementById('videoContainer') as HTMLElement;
	if (videoElement && videoContainer) {
		const player = new VideoPlayer(videoElement, videoContainer);
		// You can now control the player externally if needed
		// player.play();
		// player.setVolume(0.8);
		// player.loadSource('another-video.mp4');
	}
});
</script>
	*/
