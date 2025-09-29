import { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const Listing = () => {
  const { user } = useAuth();
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);
  const [deletingTenant, setDeletingTenant] = useState(null);
  
  // Quick action states
  const [showQuickInvoice, setShowQuickInvoice] = useState(null);
  const [showQuickMaintenance, setShowQuickMaintenance] = useState(null);
  const [contractors, setContractors] = useState([]);
  
  // Statistics
  const [statistics, setStatistics] = useState({
    totalProperties: 0,
    vacantProperties: 0,
    occupiedProperties: 0,
    totalTenants: 0,
    propertiesWithArrears: 0,
    activeMaintenance: 0
  });
  
  const [tenantForm, setTenantForm] = useState({
    name: '',
    email: '',
    phone: '',
    moveInDate: '',
    rentAmount: ''
  });

  const [quickInvoiceForm, setQuickInvoiceForm] = useState({
    type: 'rental',
    amount: '',
    dueDate: '',
    description: ''
  });

  const [quickMaintenanceForm, setQuickMaintenanceForm] = useState({
    issueType: 'plumbing',
    description: '',
    priority: 'medium',
    contractorId: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.token) {
        setError('Please log in to view listings.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const [flatsResponse, contractorsResponse] = await Promise.all([
          axiosInstance.get('/api/flats', {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axiosInstance.get('/api/flats/contractors/list', {
            headers: { Authorization: `Bearer ${user.token}` },
          })
        ]);
        
        const flatsData = flatsResponse.data;
        setFlats(flatsData);
        setContractors(contractorsResponse.data.contractors || []);
        
        // Calculate statistics
        calculateStatistics(flatsData);
        
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch property listings');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const calculateStatistics = (flatsData) => {
    const stats = {
      totalProperties: flatsData.length,
      vacantProperties: flatsData.filter(f => f.vacant).length,
      occupiedProperties: flatsData.filter(f => !f.vacant).length,
      totalTenants: flatsData.filter(f => f.tenantDetails).length,
      propertiesWithArrears: flatsData.filter(f => 
        f.invoices && f.invoices.some(inv => 
          inv.status === 'pending' && new Date(inv.dueDate) < new Date()
        )
      ).length,
      activeMaintenance: flatsData.filter(f => 
        f.maintenanceReports && f.maintenanceReports.some(r => 
          r.status !== 'completed' && r.status !== 'cancelled'
        )
      ).length
    };
    setStatistics(stats);
  };

  const updateVacancyStatus = async (flatId, isVacant) => {
    try {
      const response = await axiosInstance.put(`/api/flats/${flatId}`, 
        { vacant: isVacant },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      setFlats(flats.map(flat => 
        flat._id === flatId ? response.data : flat
      ));
      
      calculateStatistics(flats.map(flat => 
        flat._id === flatId ? response.data : flat
      ));
      
      alert(`Property marked as ${isVacant ? 'vacant' : 'occupied'}`);
    } catch (error) {
      alert('Failed to update vacancy status: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddTenant = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axiosInstance.post(
        `/api/flats/${editingTenant}/tenants`,
        tenantForm,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      setFlats(flats.map(flat => 
        flat._id === editingTenant ? response.data.flat : flat
      ));
      
      calculateStatistics(flats.map(flat => 
        flat._id === editingTenant ? response.data.flat : flat
      ));
      
      setEditingTenant(null);
      setTenantForm({ name: '', email: '', phone: '', moveInDate: '', rentAmount: '' });
      alert('Tenant added successfully!');
    } catch (error) {
      alert('Failed to add tenant: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axiosInstance.put(
        `/api/flats/${editingTenant}/tenants`,
        tenantForm,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      setFlats(flats.map(flat => 
        flat._id === editingTenant ? response.data.flat : flat
      ));
      
      setEditingTenant(null);
      setTenantForm({ name: '', email: '', phone: '', moveInDate: '', rentAmount: '' });
      alert('Tenant updated successfully!');
    } catch (error) {
      alert('Failed to update tenant: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRemoveTenant = async (flatId) => {
    if (!window.confirm('Are you sure you want to remove this tenant? This will mark the property as vacant.')) {
      return;
    }
    
    try {
      const response = await axiosInstance.delete(
        `/api/flats/${flatId}/tenants`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      setFlats(flats.map(flat => 
        flat._id === flatId ? response.data.flat : flat
      ));
      
      calculateStatistics(flats.map(flat => 
        flat._id === flatId ? response.data.flat : flat
      ));
      
      setDeletingTenant(null);
      alert('Tenant removed successfully!');
    } catch (error) {
      alert('Failed to remove tenant: ' + (error.response?.data?.message || error.message));
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

  const handleQuickInvoice = async (e, flatId) => {
    e.preventDefault();
    try {
      await axiosInstance.post(`/api/flats/${flatId}/invoices`, quickInvoiceForm, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setQuickInvoiceForm({ type: 'rental', amount: '', dueDate: '', description: '' });
      setShowQuickInvoice(null);
      alert('Invoice generated successfully!');
      
      // Refresh flats to update invoice data
      const response = await axiosInstance.get('/api/flats', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setFlats(response.data);
      calculateStatistics(response.data);
    } catch (error) {
      alert('Error generating invoice: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleQuickMaintenance = async (e, flatId) => {
    e.preventDefault();
    try {
      await axiosInstance.post(`/api/flats/${flatId}/maintenance`, quickMaintenanceForm, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setQuickMaintenanceForm({ issueType: 'plumbing', description: '', priority: 'medium', contractorId: '' });
      setShowQuickMaintenance(null);
      alert('Maintenance issue reported successfully!');
      
      // Refresh flats to update maintenance data
      const response = await axiosInstance.get('/api/flats', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setFlats(response.data);
      calculateStatistics(response.data);
    } catch (error) {
      alert('Error reporting maintenance: ' + (error.response?.data?.message || error.message));
    }
  };

  const getImageUrl = (imagePath) => {
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/uploads/flats/${imagePath}`;
  };

  const getFlatStatus = (flat) => {
    const hasOverdueInvoices = flat.invoices && flat.invoices.some(invoice => 
      invoice.status === 'pending' && new Date(invoice.dueDate) < new Date()
    );
    const hasActiveMaintenance = flat.maintenanceReports && flat.maintenanceReports.some(report => 
      report.status !== 'completed' && report.status !== 'cancelled'
    );
    
    return { hasOverdueInvoices, hasActiveMaintenance };
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
      <h1 className="text-2xl font-bold mb-2">Property Dashboard</h1>
      <p className="text-gray-600 mb-6">Manage your property listings, tenants, payments, and maintenance</p>
      
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h3 className="text-xs font-medium text-blue-600 mb-1">Total Properties</h3>
          <p className="text-2xl font-bold text-blue-800">{statistics.totalProperties}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <h3 className="text-xs font-medium text-green-600 mb-1">Occupied</h3>
          <p className="text-2xl font-bold text-green-800">{statistics.occupiedProperties}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <h3 className="text-xs font-medium text-yellow-600 mb-1">Vacant</h3>
          <p className="text-2xl font-bold text-yellow-800">{statistics.vacantProperties}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded p-4">
          <h3 className="text-xs font-medium text-purple-600 mb-1">Total Tenants</h3>
          <p className="text-2xl font-bold text-purple-800">{statistics.totalTenants}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <h3 className="text-xs font-medium text-red-600 mb-1">With Arrears</h3>
          <p className="text-2xl font-bold text-red-800">{statistics.propertiesWithArrears}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded p-4">
          <h3 className="text-xs font-medium text-orange-600 mb-1">Active Issues</h3>
          <p className="text-2xl font-bold text-orange-800">{statistics.activeMaintenance}</p>
        </div>
      </div>
      
      {/* Property Cards */}
      {flats.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No properties found. Create your first listing in the Properties section!</p>
        </div>
      ) : (
        <div className="space-y-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flats.map((flat) => {
            const { hasOverdueInvoices, hasActiveMaintenance } = getFlatStatus(flat);
            
            return (
              
              <div key={flat._id} className="bg-white shadow-md rounded p-6 border-l-4 border-gray-300">
                {/* Status Indicators */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{flat.title}</h2>
                    <p className="text-gray-600">{flat.description}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {hasOverdueInvoices && (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                        Overdue Payments
                      </span>
                    )}
                    {hasActiveMaintenance && (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-800">
                        Active Maintenance
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      flat.vacant ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {flat.vacant ? 'Vacant' : 'Occupied'}
                    </span>
                  </div>
                </div>

                {/* Tenant Information */}
                {flat.tenantDetails && (
                  <div>
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-semibold text-gray-700">Current Tenant:</h4>
                        <button
                          onClick={() => setDeletingTenant(flat._id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove Tenant
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="font-medium">Name:</span> {flat.tenantDetails.name}</div>
                        <div><span className="font-medium">Email:</span> {flat.tenantDetails.email}</div>
                        <div><span className="font-medium">Phone:</span> {flat.tenantDetails.phone}</div>
                        <div><span className="font-medium">Monthly Rent:</span> ${flat.tenantDetails.rentAmount}</div>
                        <div><span className="font-medium">Move-in Date:</span> {new Date(flat.tenantDetails.moveInDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Property Images */}
                {flat.images && flat.images.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Property Images:</h4>
                    <div className="grid grid-cols-6 gap-2">
                      {flat.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={getImageUrl(image)}
                            alt={`${flat.title} - View ${index + 1}`}
                            className="w-full h-24 object-cover rounded border hover:shadow-md transition-shadow cursor-pointer"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDlWN0MxOSA1IDEyIDUgMTIgNUM5IDUgMyA1IDMgN1Y5QzMgMTEgMyAxNyAzIDE5QzMgMjEgOSAyMSAxMiAyMUMxNSAyMSAyMSAyMSAyMSAxOUMyMSAxNyAyMSAxMSAyMSA5WiIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNOSA5SDE1IiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjwvcGF0aD4KPC9zdmc+';
                              e.target.alt = 'Image not found';
                              e.target.className += ' opacity-50';
                            }}
                          />
                          <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No images message */}
                {(!flat.images || flat.images.length === 0) && (
                  <div className="mb-4 p-3 bg-gray-200 rounded text-center text-gray-500 text-sm">
                    No images uploaded for this property
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    onClick={() => updateVacancyStatus(flat._id, true)}
                    disabled={flat.vacant}
                    className={`px-3 py-2 rounded text-sm transition-colors ${
                      flat.vacant 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    Mark Vacant
                  </button>
                  
                  <button
                    onClick={() => openTenantForm(flat._id, flat.tenantDetails)}
                    className="px-3 py-2 rounded text-sm transition-colors bg-blue-500 text-white hover:bg-blue-600"
                  >
                    {flat.tenantDetails ? 'Edit Tenant' : 'Add Tenant'}
                  </button>

                  <button
                    onClick={() => setShowQuickInvoice(flat._id)}
                    disabled={flat.vacant}
                    className="px-3 py-2 rounded text-sm transition-colors bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    Quick Invoice
                  </button>

                  <button
                    onClick={() => setShowQuickMaintenance(flat._id)}
                    className="px-3 py-2 rounded text-sm transition-colors bg-orange-500 text-white hover:bg-orange-600"
                  >
                    Report Issue
                  </button>
                </div>
              </div>
              
            );
          })}
        </div>
      )}

      {/* Tenant Form Modal */}
      {editingTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {flats.find(f => f._id === editingTenant)?.tenantDetails ? 'Edit' : 'Add'} Tenant Details
            </h3>
            <form onSubmit={flats.find(f => f._id === editingTenant)?.tenantDetails ? handleUpdateTenant : handleAddTenant}>
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

      {/* Remove Tenant Confirmation */}
      {deletingTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Remove Tenant</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove this tenant? The property will be marked as vacant.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleRemoveTenant(deletingTenant)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition-colors"
              >
                Remove Tenant
              </button>
              <button
                onClick={() => setDeletingTenant(null)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Invoice Modal */}
      {showQuickInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Quick Invoice Generation</h3>
            <form onSubmit={(e) => handleQuickInvoice(e, showQuickInvoice)}>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-semibold">Type</label>
                  <select
                    value={quickInvoiceForm.type}
                    onChange={(e) => setQuickInvoiceForm({...quickInvoiceForm, type: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="rental">Monthly Rent</option>
                    <option value="maintenance">Maintenance Charges</option>
                  </select>
                </div>
                
                <div>
                  <label className="block mb-1 font-semibold">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={quickInvoiceForm.amount}
                    onChange={(e) => setQuickInvoiceForm({...quickInvoiceForm, amount: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-1 font-semibold">Due Date</label>
                  <input
                    type="date"
                    value={quickInvoiceForm.dueDate}
                    onChange={(e) => setQuickInvoiceForm({...quickInvoiceForm, dueDate: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-1 font-semibold">Description</label>
                  <input
                    type="text"
                    value={quickInvoiceForm.description}
                    onChange={(e) => setQuickInvoiceForm({...quickInvoiceForm, description: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Monthly rent for January 2024"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
                >
                  Generate Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickInvoice(null)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Maintenance Modal */}
      {showQuickMaintenance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Quick Maintenance Report</h3>
            <form onSubmit={(e) => handleQuickMaintenance(e, showQuickMaintenance)}>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-semibold">Issue Type</label>
                  <select
                    value={quickMaintenanceForm.issueType}
                    onChange={(e) => setQuickMaintenanceForm({...quickMaintenanceForm, issueType: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="heating">Heating</option>
                    <option value="cooling">Cooling/AC</option>
                    <option value="appliance">Appliance</option>
                    <option value="structural">Structural</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block mb-1 font-semibold">Description</label>
                  <textarea
                    value={quickMaintenanceForm.description}
                    onChange={(e) => setQuickMaintenanceForm({...quickMaintenanceForm, description: e.target.value})}
                    className="w-full p-2 border rounded h-24 resize-vertical"
                    placeholder="Brief description of the issue..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-1 font-semibold">Priority</label>
                  <select
                    value={quickMaintenanceForm.priority}
                    onChange={(e) => setQuickMaintenanceForm({...quickMaintenanceForm, priority: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block mb-1 font-semibold">Contractor</label>
                  <select
                    value={quickMaintenanceForm.contractorId}
                    onChange={(e) => setQuickMaintenanceForm({...quickMaintenanceForm, contractorId: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">-- Select Contractor --</option>
                    {contractors.map(contractor => (
                      <option key={contractor.id} value={contractor.id}>
                        {contractor.name} ({contractor.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
                >
                  Report Issue
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickMaintenance(null)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Statistics */}
      {flats.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>
            Total: {flats.length} properties 
            ({statistics.vacantProperties} vacant, {statistics.occupiedProperties} occupied)
          </p>
        </div>
      )}
    </div>
  );
};

export default Listing;