import Login from '../Login';
import useToken from '../../hooks/useToken';

const Dashboard = () => {
	const { token, setToken } = useToken();
	if (!token) {
		{
			return <Login setToken={setToken} />;
		}
	}
	return <div className="text-white font-bold text-2xl">Dashboard</div>;
};

export default Dashboard;
