function onChange(obj, onChange) {
	const handler = {
		set: (target, property, value, receiver) => {
			onChange(`Property ${String(property)} changed to ${value}`);
			return Reflect.set(target, property, value, receiver);
		},
	};
	return new Proxy(obj, handler);
}

const person = { name: 'John', age: 30 };
const watchedPerson = onChange(person, console.log);

watchedPerson.age = 31;

export {};
