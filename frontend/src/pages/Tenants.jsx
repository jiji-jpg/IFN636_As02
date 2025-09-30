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

  const filteredTenants = tenants.filter(tenant =>
    tenant.tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.flatTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md mx-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Access Required</h2>
          <p className="text-gray-600 mb-8">Please log in to view tenant information.</p>
          <a 
            href="/login"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="text-white text-xl">Loading tenants...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header Section */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm border-b border-white border-opacity-20">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Tenant Management</h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              View and manage all your tenants in one place. Keep track of contact details, rent amounts, and lease information.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Search and Stats */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 border border-white border-opacity-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
                All Tenants ({filteredTenants.length})
              </h2>
              <div className="w-full md:w-96">
                <input
                  type="text"
                  placeholder="Search tenants by name, email, or property..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Tenants List */}
          <div className="bg-white rounded-2xl shadow-2xl border border-white border-opacity-20 overflow-hidden">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {filteredTenants.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-gray-400 text-4xl">👥</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {searchTerm ? 'No matching tenants found' : 'No tenants yet'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? 'Try adjusting your search criteria'
                    : 'Add tenants to your properties to see them here'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredTenants.map((tenantData) => (
                  <div key={tenantData.flatId} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1 mb-4 lg:mb-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Tenant Info */}
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Tenant Information</p>
                            <h3 className="text-lg font-semibold text-gray-800 mb-1">
                              {tenantData.tenant.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-1">{tenantData.tenant.email}</p>
                            <p className="text-gray-600 text-sm">{tenantData.tenant.phone}</p>
                          </div>
                          
                          {/* Property Info */}
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Property Details</p>
                            <p className="font-medium text-gray-800 text-sm mb-1">{tenantData.flatTitle}</p>
                          </div>
                          
                          {/* Lease Info */}
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Lease Information</p>
                            <p className="text-green-600 font-semibold text-sm mb-1">
                              ${tenantData.tenant.rentAmount}/month
                            </p>
                            <p className="text-gray-600 text-sm">
                              Moved in: {tenantData.tenant.moveInDate ? 
                                new Date(tenantData.tenant.moveInDate).toLocaleDateString() : 'N/A'
                              }
                            </p>
                          </div>
                          
                          {/* Contact & Status */}
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              <span className="text-sm text-green-600 font-medium">Active Lease</span>
                            </div>
                            <p className="text-gray-600 text-xs">
                              Lease Duration: {tenantData.tenant.moveInDate ? 
                                Math.floor((new Date() - new Date(tenantData.tenant.moveInDate)) / (1000 * 60 * 60 * 24)) 
                                : 0} days
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-3 lg:ml-6">
                        <button
                          onClick={() => openEditForm(tenantData)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleRemoveTenant(tenantData.flatId)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Edit Tenant</h3>
              <form onSubmit={handleUpdateTenant} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={tenantForm.name}
                    onChange={(e) => setTenantForm({...tenantForm, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={tenantForm.email}
                    onChange={(e) => setTenantForm({...tenantForm, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={tenantForm.phone}
                    onChange={(e) => setTenantForm({...tenantForm, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Move-in Date</label>
                  <input
                    type="date"
                    value={tenantForm.moveInDate}
                    onChange={(e) => setTenantForm({...tenantForm, moveInDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rent ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tenantForm.rentAmount}
                    onChange={(e) => setTenantForm({...tenantForm, rentAmount: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Update Tenant
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTenant(null);
                      setTenantForm({ name: '', email: '', phone: '', moveInDate: '', rentAmount: '' });
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
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