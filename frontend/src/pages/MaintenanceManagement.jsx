import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const MaintenanceManagement = () => {
  const { user } = useAuth();
  const [flats, setFlats] = useState([]);
  const [selectedFlat, setSelectedFlat] = useState('');
  const [maintenanceReports, setMaintenanceReports] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  
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
  
  const [statistics, setStatistics] = useState({
    totalReports: 0,
    reportedIssues: 0,
    inProgressIssues: 0,
    completedIssues: 0,
    urgentIssues: 0,
    totalCost: 0
  });

  useEffect(() => {
    if (user) {
      fetchFlats();
      fetchContractors();
    }
  }, [user]);

  useEffect(() => {
    if (selectedFlat) {
      fetchMaintenanceReports();
    }
  }, [selectedFlat]);

  const fetchFlats = async () => {
    try {
      const response = await axiosInstance.get('/api/flats', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setFlats(response.data);
      calculateOverviewStatistics(response.data);
    } catch (error) {
      console.error('Error fetching flats:', error);
      alert('Failed to fetch properties.');
    }
  };

  const calculateOverviewStatistics = (flatsData) => {
    let totalReports = 0;
    let reportedIssues = 0;
    let inProgressIssues = 0;
    let completedIssues = 0;
    let urgentIssues = 0;
    let totalCost = 0;

    flatsData.forEach(flat => {
      if (flat.maintenanceReports) {
        flat.maintenanceReports.forEach(report => {
          totalReports++;
          
          switch (report.status) {
            case 'reported':
              reportedIssues++;
              break;
            case 'in-progress':
              inProgressIssues++;
              break;
            case 'completed':
              completedIssues++;
              if (report.actualCost) {
                totalCost += report.actualCost;
              }
              break;
          }
          
          if (report.priority === 'urgent') {
            urgentIssues++;
          }
        });
      }
    });

    setStatistics({
      totalReports,
      reportedIssues,
      inProgressIssues,
      completedIssues,
      urgentIssues,
      totalCost
    });
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
      fetchFlats();
      alert('Maintenance issue reported successfully!');
    } catch (error) {
      alert('Failed to report maintenance issue: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

const handleUpdateStatus = async (e) => {
  e.preventDefault();
  if (!editingReport) return;

  try {
    setLoading(true);
    const reportId = editingReport.id || editingReport._id;
    const flatId = editingReport.flatId || selectedFlat;
    
    await axiosInstance.put(
      `/api/flats/${flatId}/maintenance/${reportId}`,
      statusForm,
      { headers: { Authorization: `Bearer ${user.token}` } }
    );

    setStatusForm({ status: '', actualCost: '', completionDate: '', notes: '' });
    setEditingReport(null);
    setShowStatusForm(false);
    fetchMaintenanceReports();
    fetchFlats();
    alert('Maintenance status updated successfully!');
  } catch (error) {
    alert('Failed to update status: ' + (error.response?.data?.message || error.message));
  } finally {
    setLoading(false);
  }
};

  const handleDeleteReport = async (reportId, flatId) => {
  if (!window.confirm('Are you sure you want to delete this maintenance report?')) {
    return;
  }

  try {
    const actualFlatId = flatId || selectedFlat;
    
    await axiosInstance.delete(`/api/flats/${actualFlatId}/maintenance/${reportId}`, {
      headers: { Authorization: `Bearer ${user.token}` }
    });

    fetchMaintenanceReports();
    fetchFlats();
    alert('Maintenance report deleted successfully!');
  } catch (error) {
    alert('Failed to delete report: ' + (error.response?.data?.message || error.message));
  }
};

  const openStatusForm = (report) => {
    setEditingReport(report);
    setStatusForm({
      status: report.status || '',
      actualCost: report.actualCost || '',
      completionDate: report.completionDate ? report.completionDate.split('T')[0] : '',
      notes: report.notes || ''
    });
    setShowStatusForm(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reported': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      case 'urgent': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredReports = maintenanceReports.filter(report => {
    const matchesSearch = report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.issueType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.contractorName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || report.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-purple-600 text-4xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Required</h2>
          <p className="text-gray-600 mb-8">Please log in to access maintenance management.</p>
          <a 
            href="/login"
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-5 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                Maintenance Management
              </h1>
              <p className="text-gray-600">
                Track and manage maintenance issues across your properties. Report issues, coordinate with contractors, and monitor progress.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard title="Total Reports" value={statistics.totalReports} />
          <StatCard title="Reported" value={statistics.reportedIssues} alert={statistics.reportedIssues > 0} />
          <StatCard title="In Progress" value={statistics.inProgressIssues}  />
          <StatCard title="Completed" value={statistics.completedIssues}  />
          <StatCard title="Urgent" value={statistics.urgentIssues}  alert={statistics.urgentIssues > 0} />
          <StatCard title="Total Cost" value={`$${statistics.totalCost.toLocaleString()}`} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Property</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
              <select
                value={selectedFlat}
                onChange={(e) => setSelectedFlat(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="">-- Select a Property --</option>
                {flats.map(flat => (
                  <option key={flat._id} value={flat._id}>
                    {flat.title} {flat.tenantDetails ? `(${flat.tenantDetails.name})` : '(Vacant)'}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedFlat && (
              <div className="flex items-end">
                <button
                  onClick={() => setShowMaintenanceForm(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2"
                >
                  <span>Report New Issue</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {selectedFlat && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search maintenance reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="reported">Reported</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="all">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="mr-2">📋</span>
                Maintenance Reports ({filteredReports.length})
              </h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading maintenance reports...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-gray-400 text-4xl">🔧</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No maintenance reports</h3>
                  <p className="text-gray-600">
                    {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                      ? 'No reports match your current filters'
                      : 'No maintenance issues have been reported for this property yet.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredReports.map((report) => (
                    <MaintenanceReportCard
                      key={report.id || report._id}
                      report={report}
                      onUpdateStatus={openStatusForm}
                      onDelete={handleDeleteReport}
                      getStatusColor={getStatusColor}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!selectedFlat && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
             <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-purple-600 text-4xl">🏠</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Select a Property</h3>
            <p className="text-gray-600 mb-8">Choose a property from the dropdown above to view and manage its maintenance reports.</p>
          </div>
        )}
      </div>

      {showMaintenanceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                Report Maintenance Issue
              </h3>
              <form onSubmit={handleReportMaintenance} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Issue Type</label>
                    <select
                      value={maintenanceForm.issueType}
                      onChange={(e) => setMaintenanceForm({...maintenanceForm, issueType: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="plumbing">Plumbing</option>
                      <option value="electrical">Electrical</option>
                      <option value="heating">Heating/Cooling</option>
                      <option value="appliance">Appliance</option>
                      <option value="structural">Structural</option>
                      <option value="pest_control">Pest Control</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={maintenanceForm.priority}
                      onChange={(e) => setMaintenanceForm({...maintenanceForm, priority: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={maintenanceForm.description}
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all h-32 resize-vertical"
                    placeholder="Describe the maintenance issue in detail..."
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contractor</label>
                    <select
                      value={maintenanceForm.contractorId}
                      onChange={(e) => setMaintenanceForm({...maintenanceForm, contractorId: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="">Select a contractor</option>
                      {contractors.map(contractor => (
                        <option key={contractor.id} value={contractor.id}>
                          {contractor.name} - {contractor.specialty}
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                  <input
                    type="date"
                    value={maintenanceForm.scheduledDate}
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, scheduledDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Images</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  
                  {selectedImages.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Selected Images ({selectedImages.length}):</p>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedImages.map((image, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                            <span className="text-sm text-gray-600 truncate">{image.name}</span>
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
                
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Reporting...' : 'Report Issue'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMaintenanceForm(false);
                      setMaintenanceForm({
                        issueType: 'plumbing',
                        description: '',
                        priority: 'medium',
                        contractorId: '',
                        estimatedCost: '',
                        scheduledDate: ''
                      });
                      setSelectedImages([]);
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

      {showStatusForm && editingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                Update Maintenance Status
              </h3>
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusForm.status}
                    onChange={(e) => setStatusForm({...statusForm, status: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Select status</option>
                    <option value="reported">Reported</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter actual cost"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Completion Date</label>
                  <input
                    type="date"
                    value={statusForm.completionDate}
                    onChange={(e) => setStatusForm({...statusForm, completionDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={statusForm.notes}
                    onChange={(e) => setStatusForm({...statusForm, notes: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all h-24 resize-vertical"
                    placeholder="Additional notes about the work done..."
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Status'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStatusForm(false);
                      setEditingReport(null);
                      setStatusForm({ status: '', actualCost: '', completionDate: '', notes: '' });
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
    </div>
  );
};

const StatCard = ({ icon, title, value, color, alert = false }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${alert ? 'ring-2 ring-red-200 bg-red-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-xs font-medium mb-1">{title}</p>
          <p className={`text-lg font-bold ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
        </div>
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center ${alert ? 'animate-pulse' : ''}`}>
          <span className="text-white text-lg">{icon}</span>
        </div>
      </div>
    </div>
  );
};

const MaintenanceReportCard = ({ report, onUpdateStatus, onDelete, getStatusColor, getPriorityColor }) => {
  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow bg-white">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-lg font-semibold text-gray-800 capitalize">{report.issueType}</h4>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(report.priority)}`}>
              {report.priority}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-3">{report.description}</p>
          
          {report.contractorName && (
            <div className="text-sm text-gray-600 mb-2">
              <strong>Contractor:</strong> {report.contractorName}
              {report.contractorPhone && ` (${report.contractorPhone})`}
            </div>
          )}
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Reported: {new Date(report.reportedDate).toLocaleDateString()}</span>
            {report.estimatedCost && <span>Est. Cost: ${report.estimatedCost}</span>}
          </div>
        </div>
        
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
          {report.status?.replace('-', ' ') || 'reported'}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onUpdateStatus(report)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <span>Update Status</span>
        </button>
        <button
          onClick={() => onDelete(report.id || report._id, report.flatId)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};

export default MaintenanceManagement;