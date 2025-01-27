import React from 'react';

const Modal = React.lazy(() => import(/* webpackChunkName: "Modal" */ '../Common/Modal'));

import useClickOutside from '../../hooks/useClickOutside';

import { formatTimeStamp, initialUsers, endpoint } from './helper';

import styles from './styles.css';

function DropDown({ users }) {
	const displayRef = React.useRef(null);
	const clickedOutside = useClickOutside(displayRef);

	React.useEffect(() => {
		document.querySelector('.dropdown-item input[type="checkbox"]')?.click(function (e) {
			e.stopPropagation();
		});

		document.querySelector('.dropdown-menu')?.on('click', function (e) {
			e.stopPropagation();
		});

		document.querySelector('.dropdown-toggle')?.on('click', function () {
			document.querySelector(this).toggleClass('active');
		});

		document
			.querySelector('.dropdown-item input[type="checkbox"]')
			?.on('change', function () {
				var selectedItems = [];
				document.querySelector('.dropdown-item input:checked')?.each(function () {
					selectedItems.push(document.querySelector(this).val());
				});

				document.querySelector('.dropdown-toggle').text('Select options');
				if (selectedItems.length > 0) {
					document.querySelector('.dropdown-toggle').text(selectedItems.join(', '));
				}
			});

		if (clickedOutside) {
			document.querySelector('.dropdown-toggle')?.removeClass('active');
		}
	}, []);

	return (
		<div className={styles['dropdown']}>
			<select
				className={styles['dropdown-menu']}
				aria-labelledby="dropdownMenuButton"
				ref={displayRef}
			>
				{users.map((user) => (
					<option className={styles['dropdown-item']} key={user}>
						<input type="checkbox" value={user} /> {user}
					</option>
				))}
			</select>
		</div>
	);
}

function Comments(props) {
	const [showModal, setShowModal] = React.useState(false);
	const [data, setData] = React.useState([]);
	const [users, setUsers] = React.useState(initialUsers);

	React.useEffect(() => {
		fetch(endpoint)
			.then((response) => {
				if (response.status == 200) {
					return response.json();
				} else {
					throw new Error(response);
				}
			})
			.then((data) => {
				setData(data.comments);
			});
	}, [endpoint]);

	const header = (
		<header>
			<span>'Comments' ({data.count})</span>
			<span>Loan ID {Math.ceil(Math.random() * 10000000000)}</span>
			<button onClick={() => setShowModal(false)} type="button" aria-label="close">
				X
			</button>
		</header>
	);

	const body = data.map((row) => (
		<div>
			<div>
				{row.updatedBy
					.split(' ')
					.map((name) => name[0])
					.join(' ')}
			</div>
			<div className={styles.row} key={row.updatedOn}>
				<div>{row.updatedBy}</div>
				<div>{row.comment}</div>
				{row.taggedTo.length ? <div>{row.taggedTo?.join(', ')}</div> : null}
				<div>{formatTimeStamp(row.updatedOn)}</div>
			</div>
		</div>
	));

	const modal = showModal ? (
		<Modal>
			<div className={styles['modal-container']}>
				<div className={styles['modal-content']}>
					{header}
					<body className={styles['body']}>{body}</body>
					<div>
						<input type="text" placeholder="Your Comment" value="" />
					</div>
					<DropDown users={users} />
				</div>
			</div>
		</Modal>
	) : null;

	const button = !showModal ? (
		<div className={styles.container}>
			<button
				className={styles['centered-element']}
				onClick={() => setShowModal(true)}
				type="button"
			>
				Add Comment
			</button>
		</div>
	) : null;

	return (
		<div>
			{modal}
			{button}
		</div>
	);
}

export default Comments;
