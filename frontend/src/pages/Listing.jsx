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
        const response = await axiosInstance.get('/api/flats', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setFlats(response.data);
        setError(null);
      } catch (error) {
        setError('Failed to fetch property listings');
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
      
      setFlats(flats.map(flat => 
        flat._id === editingTenant ? response.data : flat
      ));
      
      setEditingTenant(null);
      setTenantForm({ name: '', email: '', phone: '', moveInDate: '', rentAmount: '' });
      alert('Tenant details added successfully!');
    } catch (error) {
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

  const getImageUrl = (imagePath) => {
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/uploads/flats/${imagePath}`;
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        {error.includes('log in') ? (
          <a 
            href="/login"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            Go to Login
          </a>
        ) : (
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Property Listings</h1>
      <p className="text-gray-600 mb-6">Manage your property listings and tenant details</p>
      
      {/* Tenant Details Form Modal */}
      {editingTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Tenant Details</h3>
            <form onSubmit={handleTenantFormSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name</label>
                  <input
                    type="text"
                    value={tenantForm.name}
                    onChange={(e) => setTenantForm({...tenantForm, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={tenantForm.email}
                    onChange={(e) => setTenantForm({...tenantForm, email: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={tenantForm.phone}
                    onChange={(e) => setTenantForm({...tenantForm, phone: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Move-in Date</label>
                  <input
                    type="date"
                    value={tenantForm.moveInDate}
                    onChange={(e) => setTenantForm({...tenantForm, moveInDate: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent ($)</label>
                  <input
                    type="number"
                    value={tenantForm.rentAmount}
                    onChange={(e) => setTenantForm({...tenantForm, rentAmount: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">You haven't created any property listings yet.</p>
          <a 
            href="/flats"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            Create Your First Listing
          </a>
        </div>
      ) : (
        <div>
          {flats.map((flat) => (
            <div key={flat._id} className="bg-gray-100 p-4 mb-4 rounded shadow">
              {/* Status Badge */}
              <div className="mb-3">
                <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                  flat.vacant 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {flat.vacant ? 'VACANT' : 'OCCUPIED'}
                </span>
              </div>
              
              <h2 className="font-bold text-lg mb-2">{flat.title}</h2>
              {flat.description && <p className="mb-2">{flat.description}</p>}
              
              {flat.inspectionDate && (
                <p className="text-sm text-gray-500 mb-3">
                  Inspection Date: {new Date(flat.inspectionDate).toLocaleDateString()}
                </p>
              )}
              
              {/* Property Image */}
              {flat.images && flat.images.length > 0 ? (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Property Image
                  </h3>
                  <img
                    src={getImageUrl(flat.images[0])}
                    alt={flat.title}
                    className="w-48 h-32 object-cover rounded border hover:shadow-md transition-shadow cursor-pointer"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDlWN0MxOSA1IDEyIDUgMTIgNUM5IDUgMyA1IDMgN1Y5QzMgMTEgMyAxNyAzIDE5QzMgMjEgOSAyMSAxMiAyMUMxNSAyMSAyMSAyMSAyMSAxOUMyMSAxNyAyMSAxMSAyMSA5WiIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNOSA5SDE1IiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjwvcGF0aD4KPC9zdmc+';
                      e.target.alt = 'Image not found';
                      e.target.className += ' opacity-50';
                    }}
                    onClick={() => window.open(getImageUrl(flat.images[0]), '_blank')}
                  />
                </div>
              ) : (
                <div className="mb-4 p-3 bg-gray-200 rounded text-center text-gray-500 text-sm">
                  No images uploaded for this property
                </div>
              )}
              
              {/* Tenant Details */}
              {!flat.vacant && flat.tenantDetails && (
                <div className="mb-4 p-3 bg-white rounded border border-gray-300">
                  <h4 className="font-semibold text-gray-700 mb-2">Current Tenant:</h4>
                  <div className="text-sm space-y-1">
                    {flat.tenantDetails.name && (
                      <p><span className="font-medium">Name:</span> {flat.tenantDetails.name}</p>
                    )}
                    {flat.tenantDetails.email && (
                      <p><span className="font-medium">Email:</span> 
                        <a href={`mailto:${flat.tenantDetails.email}`} className="text-blue-600 hover:text-blue-800 ml-1">
                          {flat.tenantDetails.email}
                        </a>
                      </p>
                    )}
                    {flat.tenantDetails.phone && (
                      <p><span className="font-medium">Phone:</span> 
                        <a href={`tel:${flat.tenantDetails.phone}`} className="text-blue-600 hover:text-blue-800 ml-1">
                          {flat.tenantDetails.phone}
                        </a>
                      </p>
                    )}
                    {flat.tenantDetails.moveInDate && (
                      <p><span className="font-medium">Move-in Date:</span> {new Date(flat.tenantDetails.moveInDate).toLocaleDateString()}</p>
                    )}
                    {flat.tenantDetails.rentAmount && (
                      <p><span className="font-medium">Monthly Rent:</span> <span className="text-green-600 font-semibold">${flat.tenantDetails.rentAmount}</span></p>
                    )}
                  </div>
                </div>
              )}
              
              {!flat.vacant && !flat.tenantDetails && (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
                  Property is occupied but no tenant details added.
                </div>
              )}
              
              {/* Property Status Management */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Property Status:</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateVacancyStatus(flat._id, true)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      flat.vacant 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
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
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      !flat.vacant 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                  >
                    {flat.tenantDetails ? 'Edit Tenant' : 'Add Tenant'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Statistics */}
      {flats.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>
            Total: {flats.length} properties 
            ({flats.filter(f => f.vacant).length} vacant, {flats.filter(f => !f.vacant).length} occupied)
          </p>
        </div>
      )}
    </div>
  );
};

export default Listing;