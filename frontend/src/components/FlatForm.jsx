import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const FlatForm = ({ flats, setFlats, editingFlat, setEditingFlat }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ title: '', description: '', inspectionDate: '' });

  useEffect(() => {
    if (editingFlat) {
      setFormData({
        title: editingFlat.title,
        description: editingFlat.description,
        inspectionDate: editingFlat.inspectionDate,
      });
    } else {
      setFormData({ title: '', description: '', inspectionDate: '' });
    }
  }, [editingFlat]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a valid address.');
      return;
    }

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
      setFormData({ title: '', description: '', inspectionDate: '' });
    } catch (error) {
      alert('Failed to save flat.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded mb-6">
      <h1 className="text-2xl font-bold mb-4">{editingFlat ? 'Edit Flat Listing' : 'Create Flat Listing'}</h1>
      <label className="block mb-1 font-semibold">Address</label>
      <input
        type="text"
        placeholder="Enter valid address"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        className="w-full mb-4 p-2 border rounded"
      />
      <label className="block mb-1 font-semibold">Description</label>
      <input
        type="text"
        placeholder="Enter description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        className="w-full mb-4 p-2 border rounded"
      />
      <label className="block mb-1 font-semibold">Inspection Date</label>
      <input
        type="date"
        value={formData.inspectionDate}
        onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
        className="w-full mb-4 p-2 border rounded"
      />
      <button type="submit" className="w-full bg-gray-300 hover:bg-green-600 text-white p-2 rounded transition-colors duration-200">
        {editingFlat ? 'Update Flat' : 'Add Flat'}
      </button>
    </form>
  );
};

export default FlatForm;
