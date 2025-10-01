import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center group">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-all duration-300">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 group-hover:text-purple-700 transition-colors duration-300">
                  Property Manager
                </h1>
              </div>
            </div>
          </Link>

          <div className="flex items-center space-x-1">
            {user ? (
              <>
                <NavLink to="/listing">Dashboard</NavLink>
                <NavLink to="/flats">Properties</NavLink>
                <NavLink to="/tenants">Tenants</NavLink>
                <NavLink to="/payments">Payments</NavLink>
                <NavLink to="/maintenance">Maintenance</NavLink>
                <NavLink to="/profile">Account</NavLink>

                <button
                  onClick={handleLogout}
                  className="ml-4 bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <Link
                  to="/register"
                  className="ml-2 bg-green-500 hover:bg-green-600 text-white font-medium px-5 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, children }) => {
  return (
    <Link
      to={to}
      className="relative px-4 py-2 rounded-lg font-medium text-gray-700 hover:text-purple-700 hover:bg-purple-50 transition-all duration-300 group"
    >
      <span className="relative">
        {children}
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
      </span>
    </Link>
  );
};

export default Navbar;