import React from 'react';
import { Segment, Header } from 'semantic-ui-react';
import Form from './ContactForm';
import Table from './ContactTable';
import { ContactStoreProvider } from '../../Context/ContactContext';

function Contacts() {
	return (
		<ContactStoreProvider>
			<Segment basic>
				<Header as="h3">Contacts</Header>
				<Form />
				<Table />
			</Segment>
		</ContactStoreProvider>
	);
}

export default Contacts;
