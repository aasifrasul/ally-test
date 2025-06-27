import data from './data.json';
import DisplayNestedData, { Category } from './DisplayNestedData';

export default function DNCategories() {
	return <DisplayNestedData data={data} />;
}
