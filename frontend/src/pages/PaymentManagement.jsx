import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const PaymentManagement = () => {
  const { user } = useAuth();
  const [flats, setFlats] = useState([]);
  const [selectedFlat, setSelectedFlat] = useState('');
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [arrearsData, setArrearsData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState(null);
  
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: '',
    paymentMethod: 'bank_transfer',
    description: '',
    invoiceId: ''
  });
  
  const [invoiceForm, setInvoiceForm] = useState({
    type: 'rental',
    amount: '',
    dueDate: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      fetchFlats();
      fetchArrearsData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedFlat) {
      fetchPayments();
      fetchInvoices();
    }
  }, [selectedFlat]);

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

  const fetchPayments = async () => {
    if (!selectedFlat) return;
    try {
      const response = await axiosInstance.get(`/api/flats/${selectedFlat}/payments`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchInvoices = async () => {
    if (!selectedFlat) return;
    try {
      const response = await axiosInstance.get(`/api/flats/${selectedFlat}/invoices`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setInvoices(response.data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchArrearsData = async () => {
    try {
      const response = await axiosInstance.get('/api/flats/arrears/tracking', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setArrearsData(response.data);
    } catch (error) {
      console.error('Error fetching arrears data:', error);
    }
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedFlat) return;
    
    setLoading(true);
    try {
      await axiosInstance.post(`/api/flats/${selectedFlat}/invoices`, invoiceForm, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setInvoiceForm({ type: 'rental', amount: '', dueDate: '', description: '' });
      setShowInvoiceForm(false);
      fetchInvoices();
      fetchArrearsData();
      alert('Invoice generated successfully!');
    } catch (error) {
      alert('Error generating invoice: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedFlat) return;
    
    setLoading(true);
    try {
      await axiosInstance.post(`/api/flats/${selectedFlat}/payments`, paymentForm, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setPaymentForm({
        amount: '',
        paymentDate: '',
        paymentMethod: 'bank_transfer',
        description: '',
        invoiceId: ''
      });
      setShowPaymentForm(false);
      fetchPayments();
      fetchInvoices();
      fetchArrearsData();
      alert('Payment recorded successfully!');
    } catch (error) {
      alert('Error recording payment: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment record?')) {
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.delete(`/api/flats/${selectedFlat}/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      fetchPayments();
      fetchInvoices();
      fetchArrearsData();
      setDeletingPayment(null);
      alert('Payment deleted successfully!');
    } catch (error) {
      alert('Error deleting payment: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  const getInvoiceStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <p className="text-gray-600 mb-8">Please log in to access payment management.</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
          <p className="text-gray-600">Track invoices, record payments, and monitor arrears.</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {arrearsData && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg mb-6 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Arrears Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-red-600 mb-1">Properties in Arrears</h3>
                <p className="text-2xl font-bold text-red-800">{arrearsData.totalFlatsInArrears}</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-orange-600 mb-1">Total Amount Due</h3>
                <p className="text-2xl font-bold text-orange-800">{formatCurrency(arrearsData.totalArrearsAmount)}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-600 mb-1">Properties Up to Date</h3>
                <p className="text-2xl font-bold text-green-800">{flats.length - arrearsData.totalFlatsInArrears}</p>
              </div>
            </div>
            
            {arrearsData.arrearsData && arrearsData.arrearsData.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3 text-red-700">Properties with Overdue Payments</h3>
                <div className="space-y-3">
                  {arrearsData.arrearsData.map((arrear) => (
                    <div key={arrear.flatId} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{arrear.flatTitle}</h4>
                          <p className="text-sm text-gray-600">Tenant: {arrear.tenantName}</p>
                          <p className="text-sm text-gray-600">Email: {arrear.tenantEmail}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-700">{formatCurrency(arrear.totalArrearsAmount)}</p>
                          <p className="text-xs text-red-600">{arrear.overdueInvoicesCount} overdue invoice(s)</p>
                          <p className="text-xs text-gray-500">{arrear.daysPastDue} days past due</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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

        {selectedFlat && (
          <>
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg mb-6 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowInvoiceForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  Generate Invoice
                </button>
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  Record Payment
                </button>
              </div>
            </div>

            {showInvoiceForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-screen overflow-y-auto p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Generate Invoice</h3>
                  <form onSubmit={handleGenerateInvoice}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Type</label>
                        <select
                          value={invoiceForm.type}
                          onChange={(e) => setInvoiceForm({...invoiceForm, type: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        >
                          <option value="rental">Rental Payment</option>
                          <option value="maintenance">Maintenance Charges</option>
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
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                        <input
                          type="date"
                          value={invoiceForm.dueDate}
                          onChange={(e) => setInvoiceForm({...invoiceForm, dueDate: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={invoiceForm.description}
                          onChange={(e) => setInvoiceForm({...invoiceForm, description: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-24 resize-vertical"
                          rows={3}
                          required
                          placeholder="e.g., Monthly rent for January 2024"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Generating...' : 'Generate Invoice'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowInvoiceForm(false)}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {showPaymentForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-screen overflow-y-auto p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Record Payment</h3>
                  <form onSubmit={handleRecordPayment}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                        <input
                          type="date"
                          value={paymentForm.paymentDate}
                          onChange={(e) => setPaymentForm({...paymentForm, paymentDate: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                        <select
                          value={paymentForm.paymentMethod}
                          onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        >
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="cash">Cash</option>
                          <option value="check">Check</option>
                          <option value="online">Online Payment</option>
                          <option value="card">Card</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Link to Invoice (Optional)</label>
                        <select
                          value={paymentForm.invoiceId}
                          onChange={(e) => setPaymentForm({...paymentForm, invoiceId: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">-- Select Invoice --</option>
                          {invoices.filter(inv => inv.status === 'pending').map(invoice => (
                            <option key={invoice.id} value={invoice.id}>
                              {invoice.description} - {formatCurrency(invoice.amount)} (Due: {formatDate(invoice.dueDate)})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Linking to an invoice will mark it as paid</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                        <textarea
                          value={paymentForm.description}
                          onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-24 resize-vertical"
                          rows={3}
                          placeholder="Additional notes about this payment..."
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Recording...' : 'Record Payment'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPaymentForm(false)}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-white shadow-sm border border-gray-200 rounded-lg mb-6 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoices</h2>
              {invoices.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No invoices found for this property.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {invoices.map(invoice => {
                    const isOverdue = invoice.status === 'pending' && new Date(invoice.dueDate) < new Date();
                    return (
                      <div key={invoice.id} className={`border rounded-lg p-4 ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg capitalize">{invoice.type}</h3>
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${getInvoiceStatusColor(invoice.status)}`}>
                                {invoice.status}
                              </span>
                              {isOverdue && (
                                <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                                  OVERDUE
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm">{invoice.description}</p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-lg font-bold">{formatCurrency(invoice.amount)}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p><span className="font-medium">Issue Date:</span> {formatDate(invoice.issueDate)}</p>
                          <p><span className="font-medium">Due Date:</span> {formatDate(invoice.dueDate)}</p>
                          {invoice.paidDate && <p><span className="font-medium">Paid Date:</span> {formatDate(invoice.paidDate)}</p>}
                          {invoice.tenantName && <p><span className="font-medium">Tenant:</span> {invoice.tenantName}</p>}
                          {invoice.tenantEmail && <p><span className="font-medium">Email:</span> {invoice.tenantEmail}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h2>
              {payments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>No payments found for this property.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {payments.map(payment => (
                    <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{formatCurrency(payment.amount)}</h3>
                          <p className="text-gray-600 text-sm mb-3">{payment.description || 'No description'}</p>
                          <div className="text-xs text-gray-500 space-y-1">
                            <p><span className="font-medium">Method:</span> {payment.paymentMethod.replace('_', ' ')}</p>
                            <p><span className="font-medium">Payment Date:</span> {formatDate(payment.paymentDate)}</p>
                            <p><span className="font-medium">Recorded:</span> {formatDate(payment.recordedDate)}</p>
                            {payment.invoiceId && <p><span className="font-medium">Invoice ID:</span> {payment.invoiceId}</p>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePayment(payment.id)}
                          className="ml-4 text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        
        {!selectedFlat && (
          <div className="text-center py-16 text-gray-500">
            <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <p>Select a property to view and manage payments and invoices.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentManagement;