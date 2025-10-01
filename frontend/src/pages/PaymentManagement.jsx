import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const PaymentManagement = () => {
  const { user } = useAuth();
  const [flats, setFlats] = useState([]);
  const [selectedFlat, setSelectedFlat] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    type: 'rental',
    amount: '',
    dueDate: '',
    description: ''
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
    invoiceId: ''
  });

  const [statistics, setStatistics] = useState({
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalRevenue: 0,
    pendingAmount: 0
  });

  useEffect(() => {
    if (user) {
      fetchFlats();
    }
  }, [user]);

  useEffect(() => {
    if (selectedFlat) {
      fetchInvoicesAndPayments();
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
    let totalInvoices = 0;
    let paidInvoices = 0;
    let pendingInvoices = 0;
    let overdueInvoices = 0;
    let totalRevenue = 0;
    let pendingAmount = 0;

    flatsData.forEach(flat => {
      if (flat.invoices) {
        flat.invoices.forEach(invoice => {
          totalInvoices++;
          if (invoice.status === 'paid') {
            paidInvoices++;
            totalRevenue += invoice.amount;
          } else if (invoice.status === 'pending') {
            if (new Date(invoice.dueDate) < new Date()) {
              overdueInvoices++;
            } else {
              pendingInvoices++;
            }
            pendingAmount += invoice.amount;
          }
        });
      }
    });

    setStatistics({
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue,
      pendingAmount
    });
  };

  const fetchInvoicesAndPayments = async () => {
    if (!selectedFlat) return;
    try {
      setLoading(true);
      const [invoicesResponse, paymentsResponse] = await Promise.all([
        axiosInstance.get(`/api/flats/${selectedFlat}/invoices`, {
          headers: { Authorization: `Bearer ${user.token}` }
        }),
        axiosInstance.get(`/api/flats/${selectedFlat}/payments`, {
          headers: { Authorization: `Bearer ${user.token}` }
        })
      ]);
      setInvoices(invoicesResponse.data.invoices || []);
      setPayments(paymentsResponse.data.payments || []);
    } catch (error) {
      console.error('Error fetching invoices and payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedFlat) return;
    
    try {
      setLoading(true);
      await axiosInstance.post(`/api/flats/${selectedFlat}/invoices`, invoiceForm, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setInvoiceForm({ type: 'rental', amount: '', dueDate: '', description: '' });
      setShowInvoiceForm(false);
      fetchInvoicesAndPayments();
      fetchFlats();
      alert('Invoice generated successfully!');
    } catch (error) {
      alert('Failed to generate invoice: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedFlat) return;
    
    try {
      setLoading(true);
      await axiosInstance.post(`/api/flats/${selectedFlat}/payments`, paymentForm, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setPaymentForm({ amount: '', paymentMethod: 'bank_transfer', paymentDate: new Date().toISOString().split('T')[0], notes: '', invoiceId: '' });
      setShowPaymentForm(false);
      fetchInvoicesAndPayments();
      fetchFlats();
      alert('Payment recorded successfully!');
    } catch (error) {
      alert('Failed to record payment: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getInvoiceStatus = (invoice) => {
    if (invoice.status === 'paid') return 'paid';
    if (new Date(invoice.dueDate) < new Date()) return 'overdue';
    return 'pending';
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const status = getInvoiceStatus(invoice);
    const matchesStatus = filterStatus === 'all' || filterStatus === status;
    
    return matchesSearch && matchesStatus;
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-purple-600 text-4xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Required</h2>
          <p className="text-gray-600 mb-8">Please log in to access payment management.</p>
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
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                Payment Management
              </h1>
              <p className="text-gray-600">
                Manage invoices, track payments, and maintain financial records for all your properties
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowInvoiceForm(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <span>Generate Invoice</span>
              </button>
              <button
                onClick={() => setShowPaymentForm(true)}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <span>Record Payment</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            title="Total Invoices"
            value={statistics.totalInvoices}
          />
          <StatCard
            title="Paid"
            value={statistics.paidInvoices}
          />
          <StatCard
            title="Pending"
            value={statistics.pendingInvoices}
          />
          <StatCard
            title="Overdue"
            value={statistics.overdueInvoices}
            alert={statistics.overdueInvoices > 0}
          />
          <StatCard
            title="Total Revenue"
            value={`$${statistics.totalRevenue.toLocaleString()}`}
          />
          <StatCard
            title="Pending Amount"
            value={`$${statistics.pendingAmount.toLocaleString()}`}
          />
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
              <div className="flex gap-3 items-end">
                <button
                  onClick={() => setShowInvoiceForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2"
                >
                  <span>Generate Invoice</span>
                </button>
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2"
                >
                  <span>Record Payment</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {selectedFlat && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">🔍</span>
                    <input
                      type="text"
                      placeholder="Search invoices..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                
                <div className="md:w-48">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  Invoices ({filteredInvoices.length})
                </h3>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading invoices...</p>
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    </div>
                    <p className="text-gray-600">No invoices found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredInvoices.map(invoice => (
                      <InvoiceCard key={invoice._id} invoice={invoice} />
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  Recent Payments ({payments.length})
                </h3>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading payments...</p>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    </div>
                    <p className="text-gray-600">No payments recorded</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.map(payment => (
                      <PaymentCard key={payment._id} payment={payment} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!selectedFlat && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-purple-600 text-4xl">🏠</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Select a Property</h3>
            <p className="text-gray-600 mb-8">Choose a property from the dropdown above to view its invoices and payment history.</p>
          </div>
        )}
      </div>

      {showInvoiceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                Generate Invoice
              </h3>
              <form onSubmit={handleGenerateInvoice} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Type</label>
                  <select
                    value={invoiceForm.type}
                    onChange={(e) => setInvoiceForm({...invoiceForm, type: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="rental">Monthly Rent</option>
                    <option value="utilities">Utilities</option>
                    <option value="maintenance">Maintenance Fee</option>
                    <option value="late_fee">Late Fee</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({...invoiceForm, amount: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({...invoiceForm, dueDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={invoiceForm.description}
                    onChange={(e) => setInvoiceForm({...invoiceForm, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all h-24 resize-vertical"
                    placeholder="Optional description..."
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : 'Generate Invoice'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInvoiceForm(false)}
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

      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                Record Payment
              </h3>
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="online_payment">Online Payment</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({...paymentForm, paymentDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Related Invoice (Optional)</label>
                  <select
                    value={paymentForm.invoiceId}
                    onChange={(e) => setPaymentForm({...paymentForm, invoiceId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">-- No specific invoice --</option>
                    {invoices.filter(inv => inv.status === 'pending').map(invoice => (
                      <option key={invoice._id} value={invoice._id}>
                        {invoice.type} - ${invoice.amount} (Due: {new Date(invoice.dueDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all h-24 resize-vertical"
                    placeholder="Optional notes about this payment..."
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Recording...' : 'Record Payment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
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
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${
      alert ? 'ring-2 ring-red-200 bg-red-50' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-xs font-medium mb-1">{title}</p>
          <p className={`text-lg font-bold ${alert ? 'text-red-600' : 'text-gray-900'}`}>
            {value}
          </p>
        </div>
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center ${
          alert ? 'animate-pulse' : ''
        }`}>
          <span className="text-white text-lg">{icon}</span>
        </div>
      </div>
    </div>
  );
};

const InvoiceCard = ({ invoice }) => {
  const getStatusColor = (invoice) => {
    const status = invoice.status === 'paid' ? 'paid' : 
                  new Date(invoice.dueDate) < new Date() ? 'overdue' : 'pending';
    
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (invoice) => {
    if (invoice.status === 'paid') return 'Paid';
    if (new Date(invoice.dueDate) < new Date()) return 'Overdue';
    return 'Pending';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold text-gray-800 capitalize">{invoice.type}</p>
          <p className="text-gray-600 text-sm">{invoice.description}</p>
        </div>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice)}`}>
          {getStatusText(invoice)}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium text-purple-600 text-lg">${invoice.amount}</span>
        <span className="text-gray-500 text-sm">Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

const PaymentCard = ({ payment }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold text-green-600 text-lg">${payment.amount}</p>
          <p className="text-gray-600 text-sm capitalize">{payment.paymentMethod?.replace('_', ' ')}</p>
          {payment.notes && <p className="text-gray-500 text-xs mt-1">{payment.notes}</p>}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            {new Date(payment.paymentDate).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(payment.paymentDate).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentManagement;