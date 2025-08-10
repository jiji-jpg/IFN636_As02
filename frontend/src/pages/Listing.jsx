import { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const Listing = () => {
  const { user } = useAuth();
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);
  const [tenantForm, setTenantForm] = useState({
    name: '',
    email: '',
    phone: '',
    moveInDate: '',
    rentAmount: ''
  });

  useEffect(() => {
    const fetchFlats = async () => {
      if (!user || !user.token) {
        setError('Please log in to view listings.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching flats...'); // Debug log
        
        const response = await axiosInstance.get('/api/flats', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        
        console.log('Flats response:', response.data); // Debug log
        setFlats(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching flats:', error);
        console.error('Error details:', error.response?.data);
        setError(`Failed to fetch property listings: ${error.response?.status || error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchFlats();
  }, [user]);

  const updateVacancyStatus = async (flatId, isVacant) => {
    try {
      await axiosInstance.put(`/api/flats/${flatId}`, 
        { vacant: isVacant },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      setFlats(flats.map(flat => 
        flat._id === flatId ? { ...flat, vacant: isVacant, tenantDetails: isVacant ? null : flat.tenantDetails } : flat
      ));
      
      alert(`Property marked as ${isVacant ? 'vacant' : 'occupied'}`);
    } catch (error) {
      console.error('Error updating vacancy status:', error);
      alert('Failed to update vacancy status');
    }
  };

  const handleTenantFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const tenantData = {
        ...tenantForm,
        rentAmount: tenantForm.rentAmount ? Number(tenantForm.rentAmount) : null
      };
      
      const response = await axiosInstance.put(`/api/flats/${editingTenant}`, 
        { 
          vacant: false,
          tenantDetails: tenantData
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      console.log('Tenant details saved:', response.data); // Debug log
      
      // Update the flats state with the response data
      setFlats(flats.map(flat => 
        flat._id === editingTenant ? response.data : flat
      ));
      
      // Reset form
      setEditingTenant(null);
      setTenantForm({ name: '', email: '', phone: '', moveInDate: '', rentAmount: '' });
      alert('Tenant details added successfully!');
    } catch (error) {
      console.error('Error adding tenant details:', error);
      console.error('Error response:', error.response?.data);
      alert('Failed to add tenant details');
    }
  };

  const openTenantForm = (flatId, existingTenant = null) => {
    setEditingTenant(flatId);
    if (existingTenant) {
      setTenantForm({
        name: existingTenant.name || '',
        email: existingTenant.email || '',
        phone: existingTenant.phone || '',
        moveInDate: existingTenant.moveInDate ? existingTenant.moveInDate.split('T')[0] : '',
        rentAmount: existingTenant.rentAmount || ''
      });
    } else {
      setTenantForm({ name: '', email: '', phone: '', moveInDate: '', rentAmount: '' });
    }
  };

  // Function to get image URL
  const getImageUrl = (imagePath) => {
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/uploads/flats/${imagePath}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-lg">Loading property listings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-red-500 text-lg">{error}</p>
          {error.includes('log in') ? (
            <div className="mt-4">
              <a 
                href="/login" 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Go to Login
              </a>
            </div>
          ) : (
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">My Property Listings</h1>
        <p className="text-gray-600">Manage your property listings and tenant details</p>
      </div>
      
      {/* Tenant Details Form Modal */}
      {editingTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Tenant Details</h3>
            <form onSubmit={handleTenantFormSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name</label>
                  <input
                    type="text"
                    value={tenantForm.name}
                    onChange={(e) => setTenantForm({...tenantForm, name: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={tenantForm.email}
                    onChange={(e) => setTenantForm({...tenantForm, email: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={tenantForm.phone}
                    onChange={(e) => setTenantForm({...tenantForm, phone: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Move-in Date</label>
                  <input
                    type="date"
                    value={tenantForm.moveInDate}
                    onChange={(e) => setTenantForm({...tenantForm, moveInDate: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent ($)</label>
                  <input
                    type="number"
                    value={tenantForm.rentAmount}
                    onChange={(e) => setTenantForm({...tenantForm, rentAmount: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
                >
                  Save Tenant Details
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {flats.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">You haven't created any property listings yet.</p>
          <a 
            href="/flats" 
            className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Your First Listing
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flats.map((flat) => (
            <div key={flat._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Vacancy Status Badge */}
              <div className="relative">
                <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold z-10 ${
                  flat.vacant 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {flat.vacant ? 'VACANT' : 'OCCUPIED'}
                </div>
                
                {/* Property Images */}
                {flat.images && flat.images.length > 0 ? (
                  <div className="relative">
                    <img
                      src={getImageUrl(flat.images[0])} // Show first image as main
                      alt={flat.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDlWN0MxOSA1IDEyIDUgMTIgNUM5IDUgMyA1IDMgN1Y5QzMgMTEgMyAxNyAzIDE5QzMgMjEgOSAyMSAxMiAyMUMxNSAyMSAyMSAyMSAyMSAxOUMyMSAxNyAyMSAxMSAyMSA5WiIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNOSA5SDE1IiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjwvcGF0aD4KPC9zdmc+';
                        e.target.alt = 'Property image';
                      }}
                    />
                    {flat.images.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        +{flat.images.length - 1} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No images available</span>
                  </div>
                )}
              </div>
              
              {/* Property Details */}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{flat.title}</h2>
                
                {flat.description && (
                  <p className="text-gray-600 mb-3 line-clamp-2">{flat.description}</p>
                )}
                
                {flat.inspectionDate && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-blue-600">
                      Inspection: {new Date(flat.inspectionDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                {/* Tenant Details - Enhanced Display */}
                {!flat.vacant && flat.tenantDetails && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                      👤 Current Tenant
                    </h4>
                    <div className="text-sm space-y-1">
                      {flat.tenantDetails.name && (
                        <p><span className="font-medium text-gray-700">Name:</span> <span className="text-gray-900">{flat.tenantDetails.name}</span></p>
                      )}
                      {flat.tenantDetails.email && (
                        <p><span className="font-medium text-gray-700">Email:</span> 
                          <a href={`mailto:${flat.tenantDetails.email}`} className="text-blue-600 hover:text-blue-800 ml-1">
                            {flat.tenantDetails.email}
                          </a>
                        </p>
                      )}
                      {flat.tenantDetails.phone && (
                        <p><span className="font-medium text-gray-700">Phone:</span> 
                          <a href={`tel:${flat.tenantDetails.phone}`} className="text-blue-600 hover:text-blue-800 ml-1">
                            {flat.tenantDetails.phone}
                          </a>
                        </p>
                      )}
                      {flat.tenantDetails.moveInDate && (
                        <p><span className="font-medium text-gray-700">Move-in Date:</span> <span className="text-gray-900">{new Date(flat.tenantDetails.moveInDate).toLocaleDateString()}</span></p>
                      )}
                      {flat.tenantDetails.rentAmount && (
                        <p><span className="font-medium text-gray-700">Monthly Rent:</span> <span className="text-green-600 font-semibold">${flat.tenantDetails.rentAmount}</span></p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Message when property is occupied but no tenant details */}
                {!flat.vacant && !flat.tenantDetails && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 text-sm">⚠️ Property is marked as occupied but no tenant details added.</p>
                  </div>
                )}
                
                {/* Vacancy Management Buttons */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Property Status:</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateVacancyStatus(flat._id, true)}
                      className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                        flat.vacant 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Mark Vacant
                    </button>
                    <button
                      onClick={() => {
                        if (flat.tenantDetails) {
                          openTenantForm(flat._id, flat.tenantDetails);
                        } else {
                          openTenantForm(flat._id);
                        }
                      }}
                      className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                        !flat.vacant 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {flat.tenantDetails ? 'Edit Tenant' : 'Add Tenant'}
                    </button>
                  </div>
                </div>
                
                {/* Gallery Button */}
                {flat.images && flat.images.length > 1 && (
                  <div className="mt-4">
                    <button 
                      onClick={() => {
                        // You can add an image gallery modal here
                        alert(`This property has ${flat.images.length} photos. Gallery view coming soon!`);
                      }}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                    >
                      Gallery ({flat.images.length})
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Stats */}
      {flats.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-500">
            Showing {flats.length} propert{flats.length === 1 ? 'y' : 'ies'} 
            ({flats.filter(f => f.vacant).length} vacant, {flats.filter(f => !f.vacant).length} occupied)
          </p>
        </div>
      )}
    </div>
  );
};

export default Listing;