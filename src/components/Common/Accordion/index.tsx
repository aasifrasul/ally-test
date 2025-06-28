import React from 'react';

import AccordionSection from './AccordionSection';

type KeyValuePair = {
	label: string;
	value: string;
};

type Section = {
	label: string;
	isOpen: boolean;
	content: KeyValuePair[];
};

interface AccordionProps {
	allowMultipleOpen?: boolean;
	sections: Section[];
}

function Accordion(props: AccordionProps) {
	const [openSections, setOpenSections] = React.useState<{ [key: string]: boolean }>({});

	React.useEffect(() => {
		props.sections?.forEach(
			({ isOpen, label }) =>
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
			{props.sections?.map(({ content, label }) => (
				<AccordionSection
					key={label}
					isOpen={!!openSections[label]}
					label={label}
					onClick={() => onClick(label)}
				>
					{content.map((item, index) => (
						<p key={index}>
							<strong>{item.label}:</strong> {item.value}
						</p>
					))}
				</AccordionSection>
			))}
		</div>
	);
}

export default Accordion;
