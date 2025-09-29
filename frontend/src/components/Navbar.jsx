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
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center group">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-all duration-300 group-hover:shadow-lg">
                <span className="text-white font-bold text-lg">🏠</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:to-purple-900 transition-all duration-300">
                  Property Manager
                </h1>
                <p className="text-xs text-gray-500 -mt-1 group-hover:text-gray-600 transition-colors duration-300">
                  Smart Property Solutions
                </p>
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {user ? (
              <>
                {/* Main Navigation Links */}
                <NavLink to="/listing" icon="📊">
                  Dashboard
                </NavLink>
                <NavLink to="/flats" icon="🏢">
                  Properties
                </NavLink>
                <NavLink to="/tenants" icon="👥">
                  Tenants
                </NavLink>

                {/* Feature Links with Emojis */}
                <NavLink to="/payments" icon="💰" gradient={true}>
                  Payments
                </NavLink>
                <NavLink to="/maintenance" icon="🔧" gradient={true}>
                  Maintenance
                </NavLink>

                {/* User Account Dropdown Style */}
                <div className="relative group ml-4">
                  <NavLink to="/profile" icon="👤" isProfile={true}>
                    Account
                  </NavLink>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="ml-4 relative overflow-hidden bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    <span>Logout</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <button className="ml-2 relative overflow-hidden bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg group">
                  <Link
                    to="/register"
                    className="relative z-10 flex items-center space-x-2"
                  >
                    <span>Register</span>
                  </Link>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Animated underline that follows the active link */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </nav>
  );
};

// NavLink Component with Hover Animations
const NavLink = ({
  to,
  children,
  icon,
  gradient = false,
  isProfile = false,
}) => {
  const baseClasses =
    "relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 group overflow-hidden";

  const normalClasses =
    "text-gray-700 hover:text-purple-700 hover:bg-purple-50";
  const gradientClasses = "text-gray-700 hover:text-white";
  const profileClasses =
    "text-gray-700 hover:text-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100";

  const linkClasses = `${baseClasses} ${
    gradient ? gradientClasses : isProfile ? profileClasses : normalClasses
  }`;

  return (
    <Link to={to} className={linkClasses}>
      {/* Background animation for gradient links */}
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-xl"></div>
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center space-x-2">
        <span className="text-lg transform group-hover:scale-110 transition-transform duration-300">
          {icon}
        </span>
        <span className="relative">
          {children}
          {/* Animated underline */}
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-600 group-hover:w-full transition-all duration-300"></span>
        </span>
      </span>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 bg-gradient-to-r from-purple-400 to-purple-600 blur transition-opacity duration-300"></div>
    </Link>
  );
};

export default Navbar;
