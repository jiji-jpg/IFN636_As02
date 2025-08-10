import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const FlatForm = ({ flats, setFlats, editingFlat, setEditingFlat }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ title: '', description: '', inspectionDate: '' });
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editingFlat) {
      setFormData({
        title: editingFlat.title,
        description: editingFlat.description,
        inspectionDate: editingFlat.inspectionDate,
      });
      setSelectedImages([]); // Clear images when editing
    } else {
      setFormData({ title: '', description: '', inspectionDate: '' });
      setSelectedImages([]);
    }
  }, [editingFlat]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
  };

  const removeImage = (indexToRemove) => {
    setSelectedImages(selectedImages.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a valid address.');
      return;
    }

    setUploading(true);

    try {
      // Create FormData for multipart/form-data
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('inspectionDate', formData.inspectionDate);
      
      // Add images to form data
      selectedImages.forEach((image) => {
        submitData.append('images', image);
      });

      if (editingFlat) {
        const response = await axiosInstance.put(`/api/flats/${editingFlat._id}`, submitData, {
          headers: { 
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'multipart/form-data'
          },
        });
        setFlats(flats.map((flat) => (flat._id === response.data._id ? response.data : flat)));
      } else {
        const response = await axiosInstance.post('/api/flats', submitData, {
          headers: { 
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'multipart/form-data'
          },
        });
        setFlats([...flats, response.data]);
      }
      
      // Reset form
      setEditingFlat(null);
      setFormData({ title: '', description: '', inspectionDate: '' });
      setSelectedImages([]);
      
      // Clear file input
      const fileInput = document.getElementById('image-upload-input');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Error saving flat:', error);
      alert('Failed to save flat.');
    } finally {
      setUploading(false);
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
        required
      />
      
      <label className="block mb-1 font-semibold">Description</label>
      <textarea
        placeholder="Enter description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        className="w-full mb-4 p-2 border rounded h-24 resize-vertical"
        rows="3"
      />
      
      <label className="block mb-1 font-semibold">Inspection Date</label>
      <input
        type="date"
        value={formData.inspectionDate}
        onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
        className="w-full mb-4 p-2 border rounded"
      />
      
      {/* Image Upload Section */}
      <label className="block mb-1 font-semibold">Property Images</label>
      <input
        id="image-upload-input"
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageSelect}
        className="w-full mb-4 p-2 border rounded file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      
      {/* Selected Images Preview */}
      {selectedImages.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Selected Images ({selectedImages.length}):
          </p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {selectedImages.map((image, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 truncate">{image.name}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    ({(image.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="text-red-500 hover:text-red-700 ml-2 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <button 
        type="submit" 
        disabled={uploading}
        className="w-full bg-gray-600 hover:bg-green-600 text-white p-2 rounded transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {uploading ? 'Saving...' : (editingFlat ? 'Update Flat' : 'Add Flat')}
      </button>
    </form>
  );
};

export default FlatForm;
