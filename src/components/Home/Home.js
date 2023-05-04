import React from 'react';
import { Link } from 'react-router-dom';

// const Modal = React.lazy(() => import(/* webpackChunkName: "Modal" */ '../Common/Modal/Modal'));

const Home = (props) => {
/*
	const [showModal, setShowModal] = React.useState(false);

	const handleShow = () => setShowModal(true);
	const handleHide = () => setShowModal(false);

	const modal = showModal ? (
		<Modal>
			<div className={styles.modal}>
				<div className={styles['modal-content']}>
					With a portal, we can render content into a different part of the DOM, as
					if it were any other React child.
				</div>
				This is being rendered inside the #modal-container div.
				<button className={styles.close} onClick={handleHide}>
					Hide modal
				</button>
			</div>
		</Modal>
	) : null;
*/
	const linksHtml = [];
	for (let name in props.pages) {
		linksHtml.push(
			<li key={name}>
				<Link to={`/${name}`}>{name}</Link>
			</li>,
		);
	}

	return (
		<div>
			<nav>
				<ul>{linksHtml}</ul>
			</nav>
		</div>
	);
};

export default Home;
