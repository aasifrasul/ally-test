import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Segment } from '../Common/Segment';
import {
	Table,
	TableHeader,
	TableBody,
	TableCell,
	TableHeaderCell,
	TableRow,
	TableFooter,
} from '../Common/Table';
import Button from '../Common/Button';
import { Icon } from '../Common/Icon';
import { State } from './types';
import { deleteContact } from './ActionCreators';

function ContactTable() {
	// Subscribe to `contacts` state and access dispatch function
	const { contacts }: State = useSelector((state: any) => state.contacts);
	const dispatch = useDispatch();

	// Declare a local state to be used internally by this component
	const [selectedId, setSelectedId] = useState<number | null>(null);

	const onRemoveUser = () => {
		dispatch(deleteContact(selectedId!));
		setSelectedId(null); // Clear selection
	};

	const rows = contacts.map(({ id, name, email }) => (
		<TableRow
			key={id}
			onClick={() => setSelectedId(id)}
			active={id === selectedId}
			className="cursor-pointer"
		>
			<TableCell>{id}</TableCell>
			<TableCell>{name}</TableCell>
			<TableCell>{email}</TableCell>
		</TableRow>
	));

	return (
		<Segment>
			<Table celled striped>
				<TableHeader>
					<TableRow>
						<TableHeaderCell>Id</TableHeaderCell>
						<TableHeaderCell>Name</TableHeaderCell>
						<TableHeaderCell>Email</TableHeaderCell>
					</TableRow>
				</TableHeader>
				<TableBody>{rows}</TableBody>
				<TableFooter>
					<TableRow>
						<TableHeaderCell> </TableHeaderCell>
						<TableHeaderCell colSpan={2}>
							<Button
								icon
								color="red"
								size="small"
								disabled={!selectedId}
								onClick={onRemoveUser}
							>
								<Icon name="trash" /> Remove User
							</Button>
						</TableHeaderCell>
					</TableRow>
				</TableFooter>
			</Table>
		</Segment>
	);
}

export default ContactTable;
