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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-12 text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-8">Please log in to access tenant management.</p>
          <a 
            href="/login"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors inline-block"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading tenants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-12 text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <button 
            onClick={fetchAllTenants}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tenant Directory</h1>
          <p className="text-gray-600">View and manage all tenants across your properties</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div>
              <p className="text-gray-600 text-xs font-medium mb-1">Total Tenants</p>
              <p className="text-lg font-bold text-gray-900">{tenants.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div>
              <p className="text-gray-600 text-xs font-medium mb-1">Total Monthly Rent</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(tenants.reduce((sum, t) => sum + (t.tenant.rentAmount || 0), 0))}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div>
              <p className="text-gray-600 text-xs font-medium mb-1">Average Rent</p>
              <p className="text-lg font-bold text-gray-900">
                {tenants.length > 0 
                  ? formatCurrency(tenants.reduce((sum, t) => sum + (t.tenant.rentAmount || 0), 0) / tenants.length)
                  : '$0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-gray-200 rounded-lg mb-6 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Tenants</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by tenant name, email, or property..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Tenants ({filteredTenants.length})</h2>
          
          {filteredTenants.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>{searchTerm ? 'No tenants found matching your search.' : 'No tenants found.'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTenants.map((tenantData) => (
                <div key={tenantData.flatId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
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
                      <span className="font-semibold text-gray-700">Email: </span>
                      <span className="text-gray-600">{tenantData.tenant.email}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Phone: </span>
                      <span className="text-gray-600">{tenantData.tenant.phone}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Move-in Date: </span>
                      <span className="text-gray-600">{formatDate(tenantData.tenant.moveInDate)}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Tenure: </span>
                      <span className="text-gray-600">
                        {Math.floor((new Date() - new Date(tenantData.tenant.moveInDate)) / (1000 * 60 * 60 * 24 * 30))} months
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => openEditForm(tenantData)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      Edit Details
                    </button>
                    <button
                      onClick={() => handleRemoveTenant(tenantData.flatId)}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      Remove Tenant
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-screen overflow-y-auto p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Edit Tenant Details</h3>
            <p className="text-sm text-gray-600 mb-4">Property: {editingTenant.flatTitle}</p>
            <form onSubmit={handleUpdateTenant}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tenant Name</label>      
                  <input
                    type="text"
                    value={tenantForm.name}
                    onChange={(e) => setTenantForm({...tenantForm, name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={tenantForm.email}
                    onChange={(e) => setTenantForm({...tenantForm, email: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={tenantForm.phone}
                    onChange={(e) => setTenantForm({...tenantForm, phone: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Move-in Date</label>
                  <input
                    type="date"
                    value={tenantForm.moveInDate}
                    onChange={(e) => setTenantForm({...tenantForm, moveInDate: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rent ($)</label>
                  <input
                    type="number"
                    value={tenantForm.rentAmount}
                    onChange={(e) => setTenantForm({...tenantForm, rentAmount: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Update Tenant
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm border-t border-white border-opacity-20">
        <div className="container mx-auto px-6 py-6">
          <p className="text-white text-center text-sm opacity-75">
            © 2025 Property Manager. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Tenants;