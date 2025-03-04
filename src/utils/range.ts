export function* range(start: number = 0, end: number = Infinity, step: number = 1) {
	let current = start;

	while (current <= end) {
		yield current;
		current += step;
	}
}
