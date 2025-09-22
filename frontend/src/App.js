import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Flats from './pages/Flats';
import Listing from './pages/Listing';
// Import the new pages
import PaymentManagement from './pages/PaymentManagement';
import MaintenanceManagement from './pages/MaintenanceManagement';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/flats" element={<Flats />} />
        <Route path="/listing" element={<Listing />} />
        {/* Add the new routes */}
        <Route path="/payments" element={<PaymentManagement />} />
        <Route path="/maintenance" element={<MaintenanceManagement />} />
        {/* Default route */}
        <Route path="/" element={<Listing />} />
      </Routes>
    </Router>
  );
}

export default App;