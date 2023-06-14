import React, { useContext } from 'react';
import { Button } from 'semantic-ui-react';

const CustomButton = (props) => {
	const { text, color, callback } = props;
	return (
		<Button color={color} onClick={callback()}>
			{text}
		</Button>
	);
};

export default CustomButton;
