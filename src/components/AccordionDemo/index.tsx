import Accordion from '../Common/Accordion';
import sections from './data.json';

function AccordionDemo() {
	return (
		<div>
			<h1>Accordion Demo</h1>
			<Accordion sections={sections} allowMultipleOpen />
		</div>
	);
}

export default AccordionDemo;
