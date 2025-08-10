import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav 
      className="text-white p-4 flex justify-between items-center"
      style={{ backgroundColor: '#E7E6E3' }}
    >
      <Link to="/" className="text-2xl font-bold text-gray-800">Flat Management</Link>
      <div>
        {user ? (
          <>
            <Link to="/flats" className="mr-4 text-gray-800 hover:text-gray-600">Flat Details</Link>
            <Link to="/listing" className="mr-4 text-gray-800 hover:text-gray-600">Listing</Link>
            <Link to="/profile" className="mr-4 text-gray-800 hover:text-gray-600">Account</Link>
            
            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 text-white transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="mr-4 text-gray-800 hover:text-gray-600">Login</Link>
            <Link
              to="/register"
              className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 text-white transition-colors"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
