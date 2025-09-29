import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const MaintenanceManagement = () => {
  const { user } = useAuth();
  const [flats, setFlats] = useState([]);
  const [selectedFlat, setSelectedFlat] = useState('');
  const [maintenanceReports, setMaintenanceReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('property'); // 'property' or 'all'
  
  // Form states
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [deletingReport, setDeletingReport] = useState(null);
  
  const [maintenanceForm, setMaintenanceForm] = useState({
    issueType: 'plumbing',
    description: '',
    priority: 'medium',
    contractorId: '',
    estimatedCost: '',
    scheduledDate: ''
  });
  
  const [statusForm, setStatusForm] = useState({
    status: '',
    actualCost: '',
    completionDate: '',
    notes: ''
  });

  const [selectedImages, setSelectedImages] = useState([]);

  useEffect(() => {
    if (user) {
      fetchFlats();
      fetchContractors();
      fetchAllMaintenanceReports();
    }
  }, [user]);

  useEffect(() => {
    if (selectedFlat && viewMode === 'property') {
      fetchMaintenanceReports();
    }
  }, [selectedFlat, viewMode]);

  const fetchFlats = async () => {
    try {
      const response = await axiosInstance.get('/api/flats', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setFlats(response.data);
    } catch (error) {
      console.error('Error fetching flats:', error);
      alert('Failed to fetch properties.');
    }
  };

  const fetchContractors = async () => {
    try {
      const response = await axiosInstance.get('/api/flats/contractors/list', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setContractors(response.data.contractors || []);
    } catch (error) {
      console.error('Error fetching contractors:', error);
    }
  };

  const fetchMaintenanceReports = async () => {
    if (!selectedFlat) return;
    try {
      const response = await axiosInstance.get(`/api/flats/${selectedFlat}/maintenance`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMaintenanceReports(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching maintenance reports:', error);
    }
  };

  const fetchAllMaintenanceReports = async () => {
    try {
      const response = await axiosInstance.get('/api/flats/maintenance/all', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setAllReports(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching all maintenance reports:', error);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
  };

  const removeImage = (indexToRemove) => {
    setSelectedImages(selectedImages.filter((_, index) => index !== indexToRemove));
  };

  const handleReportMaintenance = async (e) => {
    e.preventDefault();
    if (!selectedFlat) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(maintenanceForm).forEach(key => {
        if (maintenanceForm[key]) {
          formData.append(key, maintenanceForm[key]);
        }
      });
      
      selectedImages.forEach(image => {
        formData.append('images', image);
      });

      await axiosInstance.post(`/api/flats/${selectedFlat}/maintenance`, formData, {
        headers: { 
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMaintenanceForm({
        issueType: 'plumbing',
        description: '',
        priority: 'medium',
        contractorId: '',
        estimatedCost: '',
        scheduledDate: ''
      });
      setSelectedImages([]);
      setShowMaintenanceForm(false);
      fetchMaintenanceReports();
      fetchAllMaintenanceReports();
      alert('Maintenance issue reported successfully!');
    } catch (error) {
      alert('Error reporting maintenance: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!editingReport) return;
    
    setLoading(true);
    try {
      await axiosInstance.put(
        `/api/flats/${editingReport.flatId}/maintenance/${editingReport.id}`, 
        statusForm, 
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      setStatusForm({ status: '', actualCost: '', completionDate: '', notes: '' });
      setEditingReport(null);
      setShowStatusForm(false);
      
      if (viewMode === 'property') {
        fetchMaintenanceReports();
      }
      fetchAllMaintenanceReports();
      
      alert('Maintenance status updated successfully!');
    } catch (error) {
      alert('Error updating status: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!deletingReport) return;

    setLoading(true);
    try {
      await axiosInstance.delete(
        `/api/flats/${deletingReport.flatId}/maintenance/${deletingReport.id}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      setDeletingReport(null);
      
      if (viewMode === 'property') {
        fetchMaintenanceReports();
      }
      fetchAllMaintenanceReports();
      
      alert('Maintenance report deleted successfully!');
    } catch (error) {
      alert('Error deleting report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const openStatusForm = (report, flatId = null) => {
    setEditingReport({ ...report, flatId: flatId || selectedFlat });
    setStatusForm({
      status: report.status,
      actualCost: report.actualCost || '',
      completionDate: report.completionDate ? report.completionDate.split('T')[0] : '',
      notes: report.notes || ''
    });
    setShowStatusForm(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return amount ? `${Number(amount).toFixed(2)}` : 'N/A';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'reported': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImageUrl = (imagePath) => {
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/uploads/maintenance/${imagePath}`;
  };

  const renderReportCard = (report, showFlatInfo = false) => (
    <div key={report.id} className="border border-gray-200 rounded p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          {showFlatInfo && (
            <p className="text-sm font-semibold text-blue-600 mb-1">{report.flatTitle}</p>
          )}
          <h3 className="font-medium text-lg capitalize">{(report.issueType || "").replace('_', ' ')}</h3>
          <p className="text-gray-600 text-sm">Reported: {formatDate(report.reportedDate)}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <span className={`px-2 py-1 text-xs font-semibold rounded ${getPriorityColor(report.priority)}`}>
            {report.priority}
          </span>
          <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(report.status)}`}>
            {(report.issueType || "").replace('_', ' ')}
          </span>
        </div>
      </div>
      
      <p className="text-gray-700 mb-3">{report.description}</p>
      
      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
        <div>
          <span className="font-medium">Contractor:</span> {report.contractorName || report.contractorDetails?.name}
        </div>
        <div>
          <span className="font-medium">Estimated Cost:</span> {formatCurrency(report.estimatedCost)}
        </div>
        {report.actualCost && (
          <div>
            <span className="font-medium">Actual Cost:</span> {formatCurrency(report.actualCost)}
          </div>
        )}
        {report.scheduledDate && (
          <div>
            <span className="font-medium">Scheduled:</span> {formatDate(report.scheduledDate)}
          </div>
        )}
        {report.completionDate && (
          <div>
            <span className="font-medium">Completed:</span> {formatDate(report.completionDate)}
          </div>
        )}
      </div>
      
      {report.notes && (
        <div className="mb-3 p-3 bg-gray-50 rounded">
          <span className="font-medium text-sm">Notes:</span>
          <p className="text-sm text-gray-700 mt-1">{report.notes}</p>
        </div>
      )}
      
      {report.images && report.images.length > 0 && (
        <div className="mb-3">
          <span className="font-medium text-sm">Images:</span>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {report.images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={getImageUrl(image)}
                  alt={`Maintenance ${index + 1}`}
                  className="w-full h-20 object-cover rounded border hover:shadow-md transition-shadow cursor-pointer"
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
      
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => openStatusForm(report, report.flatId)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors text-sm"
        >
          Update Status
        </button>
        <button
          onClick={() => setDeletingReport({ id: report.id, flatId: report.flatId || selectedFlat })}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors text-sm"
        >
          Delete
        </button>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-red-500 text-lg mb-4">Please log in to access maintenance management.</p>
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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Maintenance Management</h1>
      <p className="text-gray-600 mb-6">Track and manage maintenance issues across your properties</p>
      
      {/* View Mode Toggle */}
      <div className="bg-white shadow-md rounded mb-6 p-6">
        <h2 className="text-lg font-semibold mb-4">View Mode</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setViewMode('property')}
            className={`px-4 py-2 rounded transition-colors ${
              viewMode === 'property'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            By Property
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded transition-colors ${
              viewMode === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Properties
          </button>
        </div>
      </div>

      {/* Property Selection (only show in property mode) */}
      {viewMode === 'property' && (
        <div className="bg-white shadow-md rounded mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Select Property</h2>
          <label className="block mb-1 font-semibold">Property</label>
          <select
            value={selectedFlat}
            onChange={(e) => setSelectedFlat(e.target.value)}
            className="w-full mb-4 p-2 border rounded"
          >
            <option value="">-- Select a Property --</option>
            {flats.map(flat => (
              <option key={flat._id} value={flat._id}>
                {flat.title} {flat.tenantDetails ? `(${flat.tenantDetails.name})` : '(Vacant)'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Action Button (only in property mode with selection) */}
      {viewMode === 'property' && selectedFlat && (
        <div className="bg-white shadow-md rounded mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <button
            onClick={() => setShowMaintenanceForm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
          >
            Report Maintenance Issue
          </button>
        </div>
      )}

      {/* Maintenance Form Modal */}
      {showMaintenanceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Report Maintenance Issue</h3>
            <form onSubmit={handleReportMaintenance}>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-semibold">Issue Type</label>
                  <select
                    value={maintenanceForm.issueType}
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, issueType: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="heating">Heating</option>
                    <option value="cooling">Cooling/AC</option>
                    <option value="appliance">Appliance</option>
                    <option value="structural">Structural</option>
                    <option value="pest_control">Pest Control</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="painting">Painting</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Description</label>
                  <textarea
                    value={maintenanceForm.description}
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, description: e.target.value})}
                    className="w-full p-2 border rounded h-24 resize-vertical"
                    rows={3}
                    required
                    placeholder="Describe the maintenance issue in detail..."
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Priority</label>
                  <select
                    value={maintenanceForm.priority}
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, priority: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
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
                    value={maintenanceForm.contractorId}
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, contractorId: e.target.value})}
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
                <div>
                  <label className="block mb-1 font-semibold">Estimated Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={maintenanceForm.estimatedCost}
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, estimatedCost: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Optional estimated cost"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Scheduled Date</label>
                  <input
                    type="date"
                    value={maintenanceForm.scheduledDate}
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, scheduledDate: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Images</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="w-full mb-4 p-2 border rounded file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
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
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Reporting...' : 'Report Issue'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMaintenanceForm(false);
                    setSelectedImages([]);
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Form Modal */}
      {showStatusForm && editingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Update Maintenance Status</h3>
            <form onSubmit={handleUpdateStatus}>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-semibold">Status</label>
                  <select
                    value={statusForm.status}
                    onChange={(e) => setStatusForm({...statusForm, status: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="reported">Reported</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Actual Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={statusForm.actualCost}
                    onChange={(e) => setStatusForm({...statusForm, actualCost: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="Final cost"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Completion Date</label>
                  <input
                    type="date"
                    value={statusForm.completionDate}
                    onChange={(e) => setStatusForm({...statusForm, completionDate: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Notes</label>
                  <textarea
                    value={statusForm.notes}
                    onChange={(e) => setStatusForm({...statusForm, notes: e.target.value})}
                    className="w-full p-2 border rounded h-24 resize-vertical"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Status'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatusForm(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Maintenance Report</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this maintenance report? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteReport}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting...' : 'Delete Report'}
              </button>
              <button
                onClick={() => setDeletingReport(null)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Display */}
      {viewMode === 'property' && selectedFlat && (
        <div className="bg-white shadow-md rounded p-6">
          <h2 className="text-lg font-semibold mb-4">Maintenance Reports</h2>
          {maintenanceReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No maintenance reports found for this property.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {maintenanceReports.map(report => renderReportCard(report, false))}
            </div>
          )}
        </div>
      )}

      {viewMode === 'all' && (
        <div className="bg-white shadow-md rounded p-6">
          <h2 className="text-lg font-semibold mb-4">All Maintenance Reports</h2>
          {allReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No maintenance reports found across all properties.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allReports.map(report => renderReportCard(report, true))}
            </div>
          )}
        </div>
      )}

      {viewMode === 'property' && !selectedFlat && (
        <div className="text-center py-8 text-gray-500">
          <p>Select a property to view and manage maintenance reports.</p>
        </div>
      )}
    </div>
  );
};

export default MaintenanceManagement;