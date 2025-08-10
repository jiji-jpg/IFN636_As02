import { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import FlatList from '../components/FlatList';
import { useAuth } from '../context/AuthContext';

const Listing = () => {
  const { user } = useAuth();
  const [flats, setFlats] = useState([]);

  useEffect(() => {
    const fetchFlats = async () => {
      console.log('User:', user); // Debug log
      console.log('Token:', user?.token); // Debug log
      
      if (!user || !user.token) {
        console.log('No user or token available');
        return;
      }

      try {
        console.log('Fetching flats...'); // Debug log
        const response = await axiosInstance.get('/api/flats', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        console.log('Flats response:', response.data); // Debug log
        setFlats(response.data);
      } catch (error) {
        console.error('Error fetching flats:', error); // Better error logging
        alert('Failed to fetch Flat details.');
      }
    };

    fetchFlats();
  }, [user]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Property Listings</h1>
      {console.log('Flats in render:', flats)} {/* Debug log */}
      {flats.length === 0 ? (
        <p>No flats available or still loading...</p>
      ) : (
        <FlatList 
          flats={flats} 
          setFlats={setFlats} 
          setEditingFlat={() => {}} // No-op function since editing is not needed on listing page
        />
      )}
    </div>
  );
};

export default Listing;