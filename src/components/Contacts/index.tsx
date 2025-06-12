import { Segment } from '../Common/Segment';
import Form from './ContactForm';
import Table from './ContactTable';

function Contacts() {
	return (
		<Segment raised padded>
			<h3>Contacts</h3>
			<Form />
			<Table />
		</Segment>
	);
}

export default Contacts;
