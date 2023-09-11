import React from 'react';

export default function TextArea({ label, id, name, placeholder, rows, cols, callback }) {
	const [content, setContent] = React.useState('');

	const handleChange = (e) => {
		const text = e.target.value;
		setContent(text);
		callback && callback(text);
	};

	return (
		<>
			<label>
				{label}
				<textarea
					id={id}
					name={name}
					value={content}
					rows={rows}
					cols={cols}
					placeholder={placeholder}
					onChange={handleChange}
				/>
			</label>
		</>
	);
}
