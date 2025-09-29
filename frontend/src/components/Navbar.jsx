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
      className="text-white p-4 flex justify-between items-center shadow-md"
      style={{ backgroundColor: '#E7E6E3' }}
    >
      <Link to="/" className="text-2xl font-bold text-gray-800 hover:text-gray-600 transition-colors">
        Flat Management
      </Link>
      
      <div className="flex items-center space-x-1">
        {user ? (
          <>
            {/* Main Navigation Links */}
            <Link 
              to="/listing" 
              className="px-3 py-2 text-gray-800 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              to="/flats" 
              className="px-3 py-2 text-gray-800 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
            >
              Properties
            </Link>
            <Link 
              to="/tenants" 
              className="px-3 py-2 text-gray-800 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
            >
              Tenants
            </Link>
            
            {/* Feature Links */}
            <Link 
              to="/payments" 
              className="px-3 py-2 text-gray-800 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
            >
              💰 Payments
            </Link>
            <Link 
              to="/maintenance" 
              className="px-3 py-2 text-gray-800 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
            >
              🔧 Maintenance
            </Link>
            
            {/* User Account */}
            <Link 
              to="/profile" 
              className="px-3 py-2 text-gray-800 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
            >
              Account
            </Link>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="ml-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link 
              to="/login" 
              className="px-3 py-2 text-gray-800 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="ml-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
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