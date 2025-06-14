import { getRandomId } from '../../../utils/common';

export interface ShortcutConfig {
	keyPress: string;
	ctrl?: boolean;
	alt?: boolean;
	shift?: boolean;
	callback: (event: KeyboardEvent) => void;
}

export class KeyboardShortcutHelper {
	private static instance: KeyboardShortcutHelper;
	private shortcuts: Map<string, ShortcutConfig>;

	private constructor() {
		this.shortcuts = new Map();
		this.handleKeyDown = this.handleKeyDown.bind(this);
	}

	static getInstance(): KeyboardShortcutHelper {
		if (!KeyboardShortcutHelper.instance) {
			KeyboardShortcutHelper.instance = new KeyboardShortcutHelper();
		}
		return KeyboardShortcutHelper.instance;
	}

	private handleKeyDown(event: KeyboardEvent): void {
		this.shortcuts.forEach((config) => {
			if (
				event.key.toLowerCase() === config.keyPress.toLowerCase() &&
				!!config.ctrl === event.ctrlKey &&
				!!config.alt === event.altKey &&
				!!config.shift === event.shiftKey
			) {
				event.preventDefault();
				config.callback(event);
			}
		});
	}

	registerShortcut(config: ShortcutConfig): string {
		const id = getRandomId();
		this.shortcuts.set(id, config);

		// Add listener if this is the first shortcut
		if (this.shortcuts.size === 1) {
			window.addEventListener('keydown', this.handleKeyDown);
		}

		return id;
	}

	unregisterShortcut(id: string): void {
		this.shortcuts.delete(id);

		// Remove listener if no more shortcuts
		if (this.shortcuts.size === 0) {
			window.removeEventListener('keydown', this.handleKeyDown);
		}
	}
}
