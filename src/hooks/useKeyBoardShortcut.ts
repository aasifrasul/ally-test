// React Hook for using keyboard shortcuts
import { useEffect } from 'react';
import {
	ShortcutConfig,
	KeyboardShortcutHelper,
} from '../components/Common/KeyBoardShortcut/KeyBoardShortcutHelper';

export function useKeyboardShortcut(config: ShortcutConfig): void {
	const helper = KeyboardShortcutHelper.getInstance();

	useEffect(() => {
		const id = helper.registerShortcut(config);
		return () => helper.unregisterShortcut(id);
	}, [config]);
}
