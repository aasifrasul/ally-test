import React, { Component } from 'react';

class DropDown extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isListOpen: false,
			headerTitle: this.props.title,
		};
	}

	selectItem = (item) => {
		const { resetThenSet } = this.props;
		const { title, id, key } = item;

		this.setState(
			{
				headerTitle: title,
				isListOpen: false,
			},
			() => resetThenSet(id, key),
		);
	};

	static getDerivedStateFromProps(nextProps) {
		const { list, title, titleHelper, titleHelperPlural } = nextProps;

		const count = list.filter((item) => item.selected).length;

		if (count === 0) {
			return { headerTitle: title };
		}
		if (count === 1) {
			return { headerTitle: `${count} ${titleHelper}` };
		}
		if (count > 1) {
			return { headerTitle: `${count} ${titleHelperPlural}` };
		}
		return null;
	}

	close = () => {
		this.setState({
			isListOpen: false,
		});
	};

	componentDidUpdate() {
		const { isListOpen } = this.state;

		setTimeout(() => {
			if (isListOpen) {
				window.addEventListener('click', this.close);
			} else {
				window.removeEventListener('click', this.close);
			}
		}, 0);
	}

	toggleList = () => {
		this.setState((prevState) => ({
			isListOpen: !prevState.isListOpen,
		}));
	};

	render() {
		const { isListOpen, headerTitle } = this.state;
		const { list, toggleItem } = this.props;

		return (
			<div className="dd-wrapper">
				<button type="button" className="dd-list-item" onClick={this.toggleList}>
					<div className="dd-header-title">{headerTitle}</div>
				</button>
				{isListOpen && (
					<div role="list" className="dd-list">
						{list.map((item) => (
							<button
								type="button"
								className="dd-list-item"
								key={item.id}
								onClick={(e) => {
									e.stopPropagation();
									this.selectItem(item);
								}}
							>
								{item.title} {/*{item.selected && <FontAwesome name="check" />}*/}
							</button>
						))}
					</div>
				)}
			</div>
		);
	}
}

export default DropDown;
