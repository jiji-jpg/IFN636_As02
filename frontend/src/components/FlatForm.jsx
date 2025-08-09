import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const FlatForm = ({ flats, setFlats, editingFlat, setEditingFlat }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ title: '', description: '', deadline: '' });

  useEffect(() => {
    if (editingFlat) {
      setFormData({
        title: editingFlat.title,
        description: editingFlat.description,
        deadline: editingFlat.deadline,
      });
    } else {
      setFormData({ title: '', description: '', deadline: '' });
    }
  }, [editingFlat]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFlat) {
        const response = await axiosInstance.put(`/api/flats/${editingFlat._id}`, formData, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setFlats(flats.map((flat) => (flat._id === response.data._id ? response.data : flat)));
      } else {
        const response = await axiosInstance.post('/api/flats', formData, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setFlats([...flats, response.data]);
      }
      setEditingFlat(null);
      setFormData({ title: '', description: '', deadline: '' });
    } catch (error) {
      alert('Failed to save flat.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded mb-6">
      <h1 className="text-2xl font-bold mb-4">{editingFlat ? 'Your Form Name: Edit Operation' : 'Your Form Name: Create Operation'}</h1>
      <input
        type="text"
        placeholder="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        className="w-full mb-4 p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        className="w-full mb-4 p-2 border rounded"
      />
      <input
        type="date"
        value={formData.deadline}
        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
        className="w-full mb-4 p-2 border rounded"
      />
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
        {editingFlat ? 'Update Button' : 'Create Button'}
      </button>
    </form>
  );
};

export default FlatForm;
