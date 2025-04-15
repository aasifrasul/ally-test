import React from 'react';

export interface Category {
	id: number;
	name: string;
	desc: string;
	children?: Category[];
}

export default function DisplayNestedData({ data }: { data: Category[] }) {
	return data?.map((item) => {
		return (
			<div key={item.id}>
				<div>{item.name}</div>
				<div>{item.desc}</div>
				{item?.children?.length && (
					<div style={{ marginLeft: 10 }}>
						<DisplayNestedData data={item?.children} />
					</div>
				)}
			</div>
		);
	});
}
