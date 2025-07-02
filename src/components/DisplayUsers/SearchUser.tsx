import { InputText } from '../Common/InputText';

type SearchUserProps = {
	filterByText: (text: string) => void;
};

export const SearchUser = ({ filterByText }: SearchUserProps) => {
	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
			<div className="relative">
				<span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
					🔍
				</span>
				<InputText
					className="peer hidden w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500 md:block"
					name="searchText"
					size="md"
					debounceMs={250}
					onChange={filterByText}
					placeholder="Search User"
					clearable
				/>
			</div>
		</div>
	);
};
