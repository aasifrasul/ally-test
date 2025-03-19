import { Provider, useSelector, useDispatch } from 'react-redux';
import store from '../../store/CounterStore';

const Display = () => {
	const counter = useSelector((state: { counter: number }) => state.counter);
	const dispatch = useDispatch();

	const increment = () => dispatch({ type: 'INCREMENT' });
	const decrement = () => dispatch({ type: 'DECREMENT' });

	return (
		<div>
			<h2>Counter: {counter}</h2>
			<button onClick={increment}>+</button>
			<button onClick={decrement}>-</button>
		</div>
	);
};

const Counter = () => (
	<Provider store={store}>
		<Display />
	</Provider>
);

export default Counter;
