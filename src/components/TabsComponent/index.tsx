import React from 'react';
import { clsx } from 'clsx';

interface TabItem {
	name: string;
	content: React.ReactNode;
	disabled?: boolean;
}

interface TabsProps {
	tabs: TabItem[];
	defaultTab?: number;
	onChange?: (index: number) => void;
	className?: string;
}

const currentTabs: TabItem[] = [
	{ name: 'Tab 1', content: 'This is the contents of Tab 1' },
	{ name: 'Tab 2', content: 'This is the contents of Tab 2' },
	{ name: 'Tab 3', content: 'This is the contents of Tab 3' },
	{ name: 'Tab 4', content: 'This is the contents of Tab 4' },
];

const TabsComponent: React.FC<TabsProps> = ({
	tabs = currentTabs,
	defaultTab = 0,
	onChange,
	className,
}) => {
	const [activeTab, setActiveTab] = React.useState(defaultTab);

	// Ref for the tabs list for keyboard navigation
	const tabsRef = React.useRef<(HTMLButtonElement | null)[]>([]);

	const handleTabChange = (index: number): void => {
		setActiveTab(index);
		onChange?.(index);
	};

	// Keyboard navigation handler
	const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
		const tabCount = tabs.length;
		let newIndex = index;

		switch (event.key) {
			case 'ArrowRight':
				newIndex = (index + 1) % tabCount;
				break;
			case 'ArrowLeft':
				newIndex = (index - 1 + tabCount) % tabCount;
				break;
			case 'Home':
				newIndex = 0;
				break;
			case 'End':
				newIndex = tabCount - 1;
				break;
			default:
				return;
		}

		event.preventDefault();
		if (!tabs[newIndex].disabled) {
			handleTabChange(newIndex);
			tabsRef.current[newIndex]?.focus();
		}
	};

	return (
		<div className={clsx('w-full', className)}>
			<div
				role="tablist"
				aria-orientation="horizontal"
				className="flex border-b border-gray-200"
			>
				{tabs.map(({ name, disabled }, index) => (
					<button
						key={`tab-${index}`}
						ref={(el) => (tabsRef.current[index] = el)}
						role="tab"
						aria-selected={activeTab === index}
						aria-controls={`panel-${index}`}
						id={`tab-${index}`}
						tabIndex={activeTab === index ? 0 : -1}
						disabled={disabled}
						onClick={() => !disabled && handleTabChange(index)}
						onKeyDown={(e) => handleKeyDown(e, index)}
						className={clsx(
							'px-4 py-2 text-sm font-medium border-b-2 -mb-[2px] transition-colors',
							'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
							activeTab === index
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
							disabled && 'opacity-50 cursor-not-allowed',
						)}
					>
						{name}
					</button>
				))}
			</div>
			{tabs.map(({ content }, index) => (
				<div
					key={`panel-${index}`}
					role="tabpanel"
					id={`panel-${index}`}
					aria-labelledby={`tab-${index}`}
					hidden={activeTab !== index}
					tabIndex={0}
					className={clsx(
						'p-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
						'animate-fadeIn',
					)}
				>
					{content}
				</div>
			))}
		</div>
	);
};

export default TabsComponent;
