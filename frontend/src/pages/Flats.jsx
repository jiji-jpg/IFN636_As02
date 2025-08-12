import { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import FlatForm from '../components/FlatForm';
import FlatList from '../components/FlatList';
import { useAuth } from '../context/AuthContext';

const Flats = () => {
  const { user } = useAuth();
  const [flats, setFlats] = useState([]);
  const [editingFlat, setEditingFlat] = useState(null);

  useEffect(() => {
    const fetchFlats = async () => {
      try {
        const response = await axiosInstance.get('/api/flats', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setFlats(response.data);
      } catch (error) {
        alert('Failed to fetch Flat details.');
      }
    };

    fetchFlats();
  }, [user]);

  return (
    <div className="container mx-auto p-6">
      <FlatForm
        flats={flats}
        setFlats={setFlats}
        editingFlat={editingFlat}
        setEditingFlat={setEditingFlat}
      />
      <FlatList flats={flats} setFlats={setFlats} setEditingFlat={setEditingFlat} />
    </div>
  );
};

export default Flats;