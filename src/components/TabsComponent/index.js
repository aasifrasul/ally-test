import React from 'react';

import css from './styles.css';

const styles = css?.locals;

const Tabs = [
	{ name: 'Tab 1', content: 'This is the contents of Tab 1' },
	{ name: 'Tab 2', content: 'This is the contents of Tab 2' },
	{ name: 'Tab 3', content: 'This is the contents of Tab 3' },
	{ name: 'Tab 4', content: 'This is the contents of Tab 4' },
];

const TabsComponent = () => {
	const [activeTab, setActiveTab] = React.useState(0);

	const handleClick = (e, index) => {
		e.preventDefault();
		setActiveTab(() => index);
	};

	return (
		<div className={styles['tabs-container']}>
			<ul className={styles.tabs}>
				{Tabs.map(({ name }, index) => {
					let className = activeTab === index ? styles['active'] : '';
					let key = `nav-${name}`;
					return (
						<li
							key={key}
							className={className}
							onClick={(e) => handleClick(e, index)}
						>
							<a href="#">{name}</a>
						</li>
					);
				})}
			</ul>
			<div className={styles['tabs-content']}>
				{Tabs.map(({ name, content }, index) => {
					let className = styles['tabs-panel'];
					let key = `content-${name}`;

					if (index === activeTab) {
						className = `${className} ${styles['active']}`;
					}
					return (
						<div key={key} className={className} data-index={index}>
							{content}
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default TabsComponent;
