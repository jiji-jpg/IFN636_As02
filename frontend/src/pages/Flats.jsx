import { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const Flats = () => {
  const { user } = useAuth();
  const [flats, setFlats] = useState([]);
  const [editingFlat, setEditingFlat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    inspectionDate: '',
    bedrooms: '',
    bathrooms: '',
    carpark: ''
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFlats();
  }, [user]);

  useEffect(() => {
    if (editingFlat) {
      setFormData({
        title: editingFlat.title,
        description: editingFlat.description,
        inspectionDate: editingFlat.inspectionDate ? editingFlat.inspectionDate.split('T')[0] : '',
        bedrooms: editingFlat.bedrooms || '',
        bathrooms: editingFlat.bathrooms || '',
        carpark: editingFlat.carpark || '',
      });
      setSelectedImages([]);
      setShowAddForm(true);
    }
  }, [editingFlat]);

  const fetchFlats = async () => {
    try {
      const response = await axiosInstance.get('/api/flats', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setFlats(response.data);
    } catch (error) {
      alert('Failed to fetch properties.');
    } finally {
      setLoading(false);
    }
  };

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
    if (!formData.bedrooms) {
      alert('Please enter number of bedrooms.');
      return;
    }
    if (!formData.bathrooms) {
      alert('Please enter number of bathrooms.');
      return;
    }
    if (!formData.carpark) {
      alert('Please enter carpark information.');
      return;
    }

    setUploading(true);
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('inspectionDate', formData.inspectionDate);
      submitData.append('bedrooms', formData.bedrooms);
      submitData.append('bathrooms', formData.bathrooms);
      submitData.append('carpark', formData.carpark);
      
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
        setEditingFlat(null);
      } else {
        const response = await axiosInstance.post('/api/flats', submitData, {
          headers: { 
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'multipart/form-data'
          },
        });
        setFlats([...flats, response.data]);
      }
      
      setFormData({ 
        title: '', 
        description: '', 
        inspectionDate: '',
        bedrooms: '',
        bathrooms: '',
        carpark: ''
      });
      setSelectedImages([]);
      setShowAddForm(false);
      const fileInput = document.getElementById('image-upload-input');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Error saving property:', error);
      alert('Failed to save property.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (flatId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }
    
    try {
      await axiosInstance.delete(`/api/flats/${flatId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setFlats(flats.filter((flat) => flat._id !== flatId));
      alert('Property deleted successfully!');
    } catch (error) {
      alert('Failed to delete property.');
    }
  };

  const handleImageDelete = async (flatId, imageToDelete) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/flats/${flatId}/images/${imageToDelete}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      
      setFlats(flats.map(flat => 
        flat._id === flatId 
          ? { ...flat, images: flat.images.filter(img => img !== imageToDelete) }
          : flat
      ));
      
      alert('Image deleted successfully!');
    } catch (error) {
      console.error('Error deleting image:', error);
      alert(`Failed to delete image: ${error.response?.data?.message || error.message}`);
    }
  };

  const getImageUrl = (imagePath) => {
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/uploads/flats/${imagePath}`;
  };

  const resetForm = () => {
    setFormData({ 
      title: '', 
      description: '', 
      inspectionDate: '',
      bedrooms: '',
      bathrooms: '',
      carpark: ''
    });
    setSelectedImages([]);
    setEditingFlat(null);
    setShowAddForm(false);
    const fileInput = document.getElementById('image-upload-input');
    if (fileInput) fileInput.value = '';
  };

  const filteredFlats = flats.filter(flat => {
    const matchesSearch = flat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flat.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'occupied' && !flat.vacant) ||
                         (filterStatus === 'vacant' && flat.vacant);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Properties</h1>
              <p className="text-gray-600">
                Manage and organise your property portfolio with ease.
              </p>
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              Add New Property
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search properties by address or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="md:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="all">All Properties</option>
                <option value="occupied">Occupied Only</option>
                <option value="vacant">Vacant Only</option>
              </select>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{flats.length}</div>
              <div className="text-sm text-gray-600">Total Properties</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{flats.filter(f => !f.vacant).length}</div>
              <div className="text-sm text-gray-600">Occupied</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{flats.filter(f => f.vacant).length}</div>
              <div className="text-sm text-gray-600">Vacant</div>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {filteredFlats.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No matching properties found' : 'No Properties Yet'}
            </h3>
            <p className="text-gray-600 mb-8">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Add your first property to get started with managing your portfolio'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Add Your First Property
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFlats.map((flat) => (
              <PropertyCard
                key={flat._id}
                flat={flat}
                onEdit={setEditingFlat}
                onDelete={handleDelete}
                onImageDelete={handleImageDelete}
                getImageUrl={getImageUrl}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Property Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {editingFlat ? 'Edit Property' : 'Add New Property'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Address *</label>
                  <input
                    type="text"
                    placeholder="Enter property address"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Property Details Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms *</label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms *</label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      step="0.5"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Carpark *</label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={formData.carpark}
                      onChange={(e) => setFormData({ ...formData, carpark: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    placeholder="Enter property description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all h-32 resize-vertical"
                    rows="4"
                  />
                </div>

                
                {/* NEW FIELDS - Property Details Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms *</label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms *</label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      step="0.5"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Carpark *</label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={formData.carpark}
                      onChange={(e) => setFormData({ ...formData, carpark: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Inspection Date</label>
                  <input
                    type="date"
                    value={formData.inspectionDate}
                    onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Images</label>
                  <input
                    id="image-upload-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  
                  {selectedImages.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Selected Images ({selectedImages.length}):
                      </p>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedImages.map((image, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-600 truncate">{image.name}</span>
                              <span className="text-xs text-gray-400 ml-2">
                                ({(image.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="text-red-500 hover:text-red-700 ml-2 font-bold text-lg"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit" 
                    disabled={uploading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Saving...' : (editingFlat ? 'Update Property' : 'Add Property')}
                  </button>
                  
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Property Card Component
const PropertyCard = ({ flat, onEdit, onDelete, onImageDelete, getImageUrl }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === flat.images.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? flat.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Image Section */}
      <div className="relative h-48 bg-gray-200">
        {flat.images && flat.images.length > 0 ? (
          <>
            <img
              src={getImageUrl(flat.images[currentImageIndex])}
              alt={`${flat.title} - View ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDIwMCAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTkyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NiA3NkgxMjRWMTAwSDc2Vjc2WiIgZmlsbD0iI0Q1RDdEQSIvPgo8cGF0aCBkPSJNODggODhIMTEyVjEwMEg4OFY4OFoiIGZpbGw9IiNBN0E5QUMiLz4KPHRleHQgeD0iMTAwIiB5PSIxMzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2Qjc0ODEiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==';
                e.target.alt = 'No image available';
              }}
            />
            
            {flat.images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75"
                >
                  ‹
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75"
                >
                  ›
                </button>
                
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {flat.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentImageIndex 
                          ? 'bg-white' 
                          : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            
            <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
              {currentImageIndex + 1} / {flat.images.length}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">No images</span>
          </div>
        )}
        
        <div className="absolute top-2 left-2">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
            flat.vacant 
              ? 'bg-red-100 text-red-800 border border-red-200' 
              : 'bg-green-100 text-green-800 border border-green-200'
          }`}>
            {flat.vacant ? 'Vacant' : 'Occupied'}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">{flat.title}</h3>
        
        {/* Description */}
        <div className="mb-4">
          <span className="text-sm font-semibold text-gray-700">Description: </span>
          <span className="text-gray-600 text-sm">{flat.description || 'No description available'}</span>
        </div>
        
        {/* Property Details - UPDATED to show new fields */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{flat.bedrooms || 0} Bedrooms</span>
            <span>{flat.bathrooms || 0} Bathrooms</span>
            <span>{flat.carpark || 0} Carpark</span>
          </div>
          
          <div className="text-sm">
            <span className="font-semibold text-gray-700">Inspection: </span>
            <span className="text-gray-600">
              {flat.inspectionDate 
                ? new Date(flat.inspectionDate).toLocaleDateString() 
                : 'Not scheduled'
              }
            </span>
          </div>
          
          {!flat.vacant && flat.tenantDetails && (
            <div className="text-sm">
              <span className="font-semibold text-gray-700">Tenant: </span>
              <span className="text-gray-600">{flat.tenantDetails.name}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(flat)}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(flat._id)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default Flats;