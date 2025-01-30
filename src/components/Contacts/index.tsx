import React from 'react';
import { Segment, Header } from 'semantic-ui-react';
import Form from './ContactForm';
import Table from './ContactTable';

function Contacts() {
	return (
		<Segment basic>
			<Header as="h3">Contacts</Header>
			<Form />
			<Table />
		</Segment>
	);
}

export default Contacts;
