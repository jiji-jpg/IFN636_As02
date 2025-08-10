import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Flats from './pages/Flats';
import Listing from './pages/Listing';  // <-- Import Listing here

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/flats" element={<Flats />} />
        <Route path="/listing" element={<Listing />} />  {/* <-- Add Listing route */}
      </Routes>
    </Router>
  );
}

export default App;


