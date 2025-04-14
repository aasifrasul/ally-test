import { Button } from 'semantic-ui-react';

interface CustomButtonProps {
	text: string;
	color:
		| 'red'
		| 'orange'
		| 'yellow'
		| 'olive'
		| 'green'
		| 'teal'
		| 'blue'
		| 'violet'
		| 'purple'
		| 'pink'
		| 'brown'
		| 'grey'
		| 'black'
		| 'facebook'
		| 'google plus'
		| 'vk'
		| 'twitter'
		| 'linkedin'
		| 'instagram'
		| 'youtube';
	callback: Function;
}

const CustomButton = (props: CustomButtonProps) => {
	const { text, color, callback } = props;
	return (
		<Button color={color} onClick={() => callback()}>
			{text}
		</Button>
	);
};

export default CustomButton;
