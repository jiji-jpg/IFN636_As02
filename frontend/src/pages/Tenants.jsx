import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const Tenants = () => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [tenantForm, setTenantForm] = useState({
    name: '',
    email: '',
    phone: '',
    moveInDate: '',
    rentAmount: ''
  });

  useEffect(() => {
    if (user) {
      fetchAllTenants();
    }
  }, [user]);

  const fetchAllTenants = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/flats/tenants/all', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTenants(response.data.tenants || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      setError('Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    if (!editingTenant) return;

    try {
      const response = await axiosInstance.put(
        `/api/flats/${editingTenant.flatId}/tenants`,
        tenantForm,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // Update tenant in the list
      setTenants(tenants.map(tenant => 
        tenant.flatId === editingTenant.flatId 
          ? { ...tenant, tenant: response.data.tenant }
          : tenant
      ));

      setEditingTenant(null);
      setTenantForm({ name: '', email: '', phone: '', moveInDate: '', rentAmount: '' });
      alert('Tenant updated successfully!');
    } catch (error) {
      alert('Failed to update tenant: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRemoveTenant = async (flatId) => {
    if (!window.confirm('Are you sure you want to remove this tenant?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/flats/${flatId}/tenants`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      // Remove tenant from the list
      setTenants(tenants.filter(t => t.flatId !== flatId));
      alert('Tenant removed successfully!');
    } catch (error) {
      alert('Failed to remove tenant: ' + (error.response?.data?.message || error.message));
    }
  };

  const openEditForm = (tenant) => {
    setEditingTenant(tenant);
    setTenantForm({
      name: tenant.tenant.name || '',
      email: tenant.tenant.email || '',
      phone: tenant.tenant.phone || '',
      moveInDate: tenant.tenant.moveInDate ? tenant.tenant.moveInDate.split('T')[0] : '',
      rentAmount: tenant.tenant.rentAmount || ''
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  // Filter tenants based on search term
  const filteredTenants = tenants.filter(tenant => {
    const searchLower = searchTerm.toLowerCase();
    return (
      tenant.tenant.name.toLowerCase().includes(searchLower) ||
      tenant.tenant.email.toLowerCase().includes(searchLower) ||
      tenant.flatTitle.toLowerCase().includes(searchLower)
    );
  });

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-red-500 text-lg mb-4">Please log in to access tenant management.</p>
          <a 
            href="/login"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8 text-gray-500">
          <p>Loading tenants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button 
            onClick={fetchAllTenants}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Tenant Directory</h1>
      <p className="text-gray-600 mb-6">View and manage all tenants across your properties</p>

      {/* Statistics */}
      <div className="bg-white shadow-md rounded mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h3 className="text-sm font-medium text-blue-600 mb-1">Total Tenants</h3>
            <p className="text-2xl font-bold text-blue-800">{tenants.length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h3 className="text-sm font-medium text-green-600 mb-1">Total Monthly Rent</h3>
            <p className="text-2xl font-bold text-green-800">
              {formatCurrency(tenants.reduce((sum, t) => sum + (t.tenant.rentAmount || 0), 0))}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded p-4">
            <h3 className="text-sm font-medium text-purple-600 mb-1">Average Rent</h3>
            <p className="text-2xl font-bold text-purple-800">
              {tenants.length > 0 
                ? formatCurrency(tenants.reduce((sum, t) => sum + (t.tenant.rentAmount || 0), 0) / tenants.length)
                : '$0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white shadow-md rounded mb-6 p-6">
        <label className="block mb-1 font-semibold">Search Tenants</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by tenant name, email, or property..."
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Tenants List */}
      <div className="bg-white shadow-md rounded p-6">
        <h2 className="text-lg font-semibold mb-4">All Tenants ({filteredTenants.length})</h2>
        
        {filteredTenants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>{searchTerm ? 'No tenants found matching your search.' : 'No tenants found.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTenants.map((tenantData) => (
              <div key={tenantData.flatId} className="border border-gray-200 rounded p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{tenantData.tenant.name}</h3>
                    <p className="text-sm text-blue-600 font-medium">{tenantData.flatTitle}</p>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded ${
                      tenantData.vacant ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {tenantData.vacant ? 'Marked Vacant' : 'Active'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-700">
                      {formatCurrency(tenantData.tenant.rentAmount)}/mo
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>
                    <p className="text-gray-800">{tenantData.tenant.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Phone:</span>
                    <p className="text-gray-800">{tenantData.tenant.phone}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Move-in Date:</span>
                    <p className="text-gray-800">{formatDate(tenantData.tenant.moveInDate)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Tenure:</span>
                    <p className="text-gray-800">
                      {Math.floor((new Date() - new Date(tenantData.tenant.moveInDate)) / (1000 * 60 * 60 * 24 * 30))} months
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openEditForm(tenantData)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors text-sm"
                  >
                    Edit Details
                  </button>
                  <button
                    onClick={() => handleRemoveTenant(tenantData.flatId)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors text-sm"
                  >
                    Remove Tenant
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Tenant Modal */}
      {editingTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Tenant Details</h3>
            <p className="text-sm text-gray-600 mb-4">Property: {editingTenant.flatTitle}</p>
            <form onSubmit={handleUpdateTenant}>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-semibold">Tenant Name</label>
                  <input
                    type="text"
                    value={tenantForm.name}
                    onChange={(e) => setTenantForm({...tenantForm, name: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-1 font-semibold">Email</label>
                  <input
                    type="email"
                    value={tenantForm.email}
                    onChange={(e) => setTenantForm({...tenantForm, email: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-1 font-semibold">Phone</label>
                  <input
                    type="tel"
                    value={tenantForm.phone}
                    onChange={(e) => setTenantForm({...tenantForm, phone: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-1 font-semibold">Move-in Date</label>
                  <input
                    type="date"
                    value={tenantForm.moveInDate}
                    onChange={(e) => setTenantForm({...tenantForm, moveInDate: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-1 font-semibold">Monthly Rent ($)</label>
                  <input
                    type="number"
                    value={tenantForm.rentAmount}
                    onChange={(e) => setTenantForm({...tenantForm, rentAmount: e.target.value})}
                    className="w-full p-2 border rounded"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
                >
                  Update Tenant
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
    </div>
  );
};

export default Tenants;