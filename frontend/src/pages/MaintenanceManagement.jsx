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
  const [viewMode, setViewMode] = useState('property');
  
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
      console.error('Delete error:', error);
      alert('Error deleting report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const openStatusForm = (report, flatId = null) => {
    const reportId = report.id || report._id?._id || report._id || String(report._id);
    setEditingReport({ 
        ...report, 
        id: reportId,
        flatId: flatId || selectedFlat 
    });
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

  const renderReportCard = (report, showFlatInfo = false) => {
    const reportId = report.id || report._id?._id || report._id || String(report._id);
    
    return (
      <div key={reportId} className="border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            {showFlatInfo && (
              <p className="text-sm font-semibold text-blue-600 mb-1">{report.flatTitle}</p>
            )}
            <h3 className="font-semibold text-lg capitalize">{(report.issueType || "").replace('_', ' ')}</h3>
            <p className="text-gray-600 text-sm">Reported: {formatDate(report.reportedDate)}</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <span className={`px-2 py-1 text-xs font-semibold rounded ${getPriorityColor(report.priority)}`}>
              {report.priority}
            </span>
            <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(report.status)}`}>
              {report.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <p className="text-gray-700 mb-3">{report.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
          <div>
            <span className="font-semibold text-gray-700">Contractor: </span>
            <span className="text-gray-600">{report.contractorName || report.contractorDetails?.name}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Estimated Cost: </span>
            <span className="text-gray-600">{formatCurrency(report.estimatedCost)}</span>
          </div>
          {report.actualCost && (
            <div>
              <span className="font-semibold text-gray-700">Actual Cost: </span>
              <span className="text-gray-600">{formatCurrency(report.actualCost)}</span>
            </div>
          )}
          {report.scheduledDate && (
            <div>
              <span className="font-semibold text-gray-700">Scheduled: </span>
              <span className="text-gray-600">{formatDate(report.scheduledDate)}</span>
            </div>
          )}
          {report.completionDate && (
            <div>
              <span className="font-semibold text-gray-700">Completed: </span>
              <span className="text-gray-600">{formatDate(report.completionDate)}</span>
            </div>
          )}
        </div>
        
        {report.notes && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <span className="font-semibold text-sm text-gray-700">Notes: </span>
            <p className="text-sm text-gray-600 mt-1">{report.notes}</p>
          </div>
        )}
        
        {report.images && report.images.length > 0 && (
          <div className="mb-3">
            <span className="font-semibold text-sm text-gray-700">Images:</span>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {report.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={getImageUrl(image)}
                    alt={`Maintenance ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
          >
            Update Status
          </button>
          <button
            onClick={() => {
              setDeletingReport({ 
                id: reportId,
                flatId: report.flatId || selectedFlat 
              });
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

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
          <p className="text-gray-600 mb-8">Please log in to access maintenance management.</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Maintenance Management</h1>
          <p className="text-gray-600">Track and manage maintenance issues across your properties.</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg mb-6 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">View Mode</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setViewMode('property')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                viewMode === 'property'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              By Property
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                viewMode === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Properties
            </button>
          </div>
        </div>

        {viewMode === 'property' && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg mb-6 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Property</h2>
            <select
              value={selectedFlat}
              onChange={(e) => setSelectedFlat(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

        {viewMode === 'property' && selectedFlat && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg mb-6 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <button
              onClick={() => setShowMaintenanceForm(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Report Maintenance Issue
            </button>
          </div>
        )}

        {showMaintenanceForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-screen overflow-y-auto p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Report Maintenance Issue</h3>
              <form onSubmit={handleReportMaintenance}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Issue Type</label>
                    <select
                      value={maintenanceForm.issueType}
                      onChange={(e) => setMaintenanceForm({...maintenanceForm, issueType: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={maintenanceForm.description}
                      onChange={(e) => setMaintenanceForm({...maintenanceForm, description: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-24 resize-vertical"
                      rows={3}
                      required
                      placeholder="Describe the maintenance issue in detail..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={maintenanceForm.priority}
                      onChange={(e) => setMaintenanceForm({...maintenanceForm, priority: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contractor</label>
                    <select
                      value={maintenanceForm.contractorId}
                      onChange={(e) => setMaintenanceForm({...maintenanceForm, contractorId: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={maintenanceForm.estimatedCost}
                      onChange={(e) => setMaintenanceForm({...maintenanceForm, estimatedCost: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Optional estimated cost"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                    <input
                      type="date"
                      value={maintenanceForm.scheduledDate}
                      onChange={(e) => setMaintenanceForm({...maintenanceForm, scheduledDate: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
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
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Reporting...' : 'Report Issue'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMaintenanceForm(false);
                      setSelectedImages([]);
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showStatusForm && editingReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-screen overflow-y-auto p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Update Maintenance Status</h3>
              <form onSubmit={handleUpdateStatus}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={statusForm.status}
                      onChange={(e) => setStatusForm({...statusForm, status: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="reported">Reported</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Actual Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={statusForm.actualCost}
                      onChange={(e) => setStatusForm({...statusForm, actualCost: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Final cost"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Completion Date</label>
                    <input
                      type="date"
                      value={statusForm.completionDate}
                      onChange={(e) => setStatusForm({...statusForm, completionDate: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={statusForm.notes}
                      onChange={(e) => setStatusForm({...statusForm, notes: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-24 resize-vertical"
                      rows={3}
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Update Status'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStatusForm(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deletingReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Delete Maintenance Report</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this maintenance report? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteReport}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Deleting...' : 'Delete Report'}
                </button>
                <button
                  onClick={() => setDeletingReport(null)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'property' && selectedFlat && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Maintenance Reports</h2>
            {maintenanceReports.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>No maintenance reports found for this property.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {maintenanceReports.map(report => renderReportCard(report, false))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'all' && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">All Maintenance Reports</h2>
            {allReports.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>No maintenance reports found across all properties.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allReports.map(report => renderReportCard(report, true))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'property' && !selectedFlat && (
          <div className="text-center py-16 text-gray-500">
            <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <p>Select a property to view and manage maintenance reports.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceManagement;