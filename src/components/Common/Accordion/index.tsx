import React from 'react';

import AccordionSection from './AccordionSection';

interface AccordionProps {
	allowMultipleOpen?: boolean;
	children?: Array<{
		props: {
			children: React.ReactNode;
			isOpen?: boolean;
			label: string;
		};
	}>;
}

function Accordion(props: AccordionProps) {
	const [openSections, setOpenSections] = React.useState<{ [key: string]: boolean }>({});

	React.useEffect(() => {
		props.children?.forEach(
			({ props: { isOpen, label } }) =>
				isOpen &&
				setOpenSections((sections) => {
					return {
						...sections,
						[label]: true,
					};
				}),
		);
	}, []);

	const onClick = (label: string) => {
		const section = {
			[label]: !openSections[label],
		};

		setOpenSections((sections) => {
			return props.allowMultipleOpen
				? {
						...sections,
						...section,
					}
				: section;
		});
	};

	return (
		<div style={{ border: '2px solid #008f68' }}>
			{props.children?.map(({ props: { children, label } }) => (
				<AccordionSection
					key={label}
					isOpen={!!openSections[label]}
					label={label}
					onClick={() => onClick(label)}
				>
					{children}
				</AccordionSection>
			))}
		</div>
	);
}

export default Accordion;
