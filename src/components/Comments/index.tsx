import { useEffect, useState } from 'react';
import Modal from '../Common/Modal';
import { useClickOutside } from '../../hooks/useClickOutside';
import { formatTimeStamp, initialUsers, endpoint } from './helper';
import * as styles from './styles.module.css';

interface Comment {
	updatedBy: string;
	comment: string;
	taggedTo: string[];
	updatedOn: string;
}

interface DropDownProps {
	users: string[];
	onSelectionChange: (selected: string[]) => void;
}

function DropDown({ users, onSelectionChange }: DropDownProps) {
	const { isOutsideClick, outsideRef } = useClickOutside<HTMLDivElement>(false, 'mousedown');
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

	const handleCheckboxChange = (user: string, checked: boolean) => {
		const newSelection = checked
			? [...selectedUsers, user]
			: selectedUsers.filter((u) => u !== user);

		setSelectedUsers(newSelection);
		onSelectionChange(newSelection);
	};

	useEffect(() => {
		if (isOutsideClick) {
			const toggle = document.querySelector('.dropdown-toggle');
			toggle?.classList.remove('active');
		}
	}, [isOutsideClick]);

	return (
		<div className={styles.dropdown} ref={outsideRef}>
			<button
				className={styles['dropdown-toggle']}
				onClick={(e) => e.currentTarget.classList.toggle('active')}
			>
				{selectedUsers.length ? selectedUsers.join(', ') : 'Select options'}
			</button>
			<div className={styles['dropdown-menu']}>
				{users.map((user) => (
					<label key={user} className={styles['dropdown-item']}>
						<input
							type="checkbox"
							value={user}
							checked={selectedUsers.includes(user)}
							onChange={(e) => handleCheckboxChange(user, e.target.checked)}
						/>
						{user}
					</label>
				))}
			</div>
		</div>
	);
}

function Comments() {
	const [showModal, setShowModal] = useState(false);
	const [data, setData] = useState<Comment[]>([]);
	const [users, setUsers] = useState(initialUsers);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [newComment, setNewComment] = useState('');
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const response = await fetch(endpoint);
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const result = await response.json();
				setData(result.comments);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to fetch comments');
				console.error('Error fetching comments:', err);
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, []);

	const handleSubmitComment = async () => {
		if (!newComment.trim()) return;

		try {
			// Add your comment submission logic here
			const comment: Comment = {
				updatedBy: 'Current User', // Replace with actual user
				comment: newComment,
				taggedTo: selectedUsers,
				updatedOn: Date.now().toString(),
			};

			// Optimistically update UI
			setData((prev) => [...prev, comment]);
			setNewComment('');
			setSelectedUsers([]);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to submit comment');
			console.error('Error submitting comment:', err);
		}
	};

	const header = (
		<header className={styles.header}>
			<span>Comments ({data.length})</span>
			<span>Loan ID {Math.ceil(Math.random() * 10000000000)}</span>
			<button
				onClick={() => setShowModal(false)}
				type="button"
				aria-label="close"
				className={styles.closeButton}
			>
				×
			</button>
		</header>
	);

	const body = (
		<div className={styles.body}>
			{isLoading && <div className={styles.loading}>Loading comments...</div>}
			{error && <div className={styles.error}>{error}</div>}
			{!isLoading &&
				!error &&
				data.map((row) => (
					<div key={row.updatedOn} className={styles.commentRow}>
						<div className={styles.avatar}>
							{row.updatedBy
								.split(' ')
								.map((name) => name[0])
								.join('')}
						</div>
						<div className={styles.content}>
							<div className={styles.author}>{row.updatedBy}</div>
							<div className={styles.comment}>{row.comment}</div>
							{row.taggedTo.length > 0 && (
								<div className={styles.tagged}>
									Tagged: {row.taggedTo.join(', ')}
								</div>
							)}
							<div className={styles.timestamp}>
								{formatTimeStamp(Number(row.updatedOn))}
							</div>
						</div>
					</div>
				))}
		</div>
	);

	const modal = (
		<Modal isOpen={showModal}>
			<div className={styles['modal-container']}>
				<div className={styles['modal-content']}>
					{header}
					{body}
					<div className={styles.commentInput}>
						<input
							type="text"
							placeholder="Your Comment"
							value={newComment}
							onChange={(e) => setNewComment(e.target.value)}
							onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
						/>
						<DropDown users={users} onSelectionChange={setSelectedUsers} />
						<button
							onClick={handleSubmitComment}
							disabled={!newComment.trim()}
							className={styles.submitButton}
						>
							Submit
						</button>
					</div>
				</div>
			</div>
		</Modal>
	);

	return (
		<div>
			{modal}
			{!showModal && (
				<div className={styles.container}>
					<button
						className={styles['centered-element']}
						onClick={() => setShowModal(true)}
						type="button"
					>
						Add Comment
					</button>
				</div>
			)}
		</div>
	);
}

export default Comments;
