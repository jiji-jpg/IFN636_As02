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
  
  // Form states
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
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-red-500 text-lg mb-4">Please log in to access payment management.</p>
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
      <h1 className="text-2xl font-bold mb-2">Payment Management</h1>
      <p className="text-gray-600 mb-6">Track invoices, record payments, and monitor arrears</p>
      
      {/* Arrears Summary */}
      {arrearsData && (
        <div className="bg-white shadow-md rounded mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Arrears Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h3 className="text-sm font-medium text-red-600 mb-1">Properties in Arrears</h3>
              <p className="text-2xl font-bold text-red-800">{arrearsData.totalFlatsInArrears}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded p-4">
              <h3 className="text-sm font-medium text-orange-600 mb-1">Total Amount Due</h3>
              <p className="text-2xl font-bold text-orange-800">{formatCurrency(arrearsData.totalArrearsAmount)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h3 className="text-sm font-medium text-green-600 mb-1">Properties Up to Date</h3>
              <p className="text-2xl font-bold text-green-800">{flats.length - arrearsData.totalFlatsInArrears}</p>
            </div>
          </div>
          
          {/* Arrears Details */}
          {arrearsData.arrearsData && arrearsData.arrearsData.length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-semibold mb-3 text-red-700">Properties with Overdue Payments</h3>
              <div className="space-y-3">
                {arrearsData.arrearsData.map((arrear) => (
                  <div key={arrear.flatId} className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{arrear.flatTitle}</h4>
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

      {/* Property Selection */}
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

      {selectedFlat && (
        <>
          {/* Action Buttons */}
          <div className="bg-white shadow-md rounded mb-6 p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setShowInvoiceForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
              >
                Generate Invoice
              </button>
              <button
                onClick={() => setShowPaymentForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
              >
                Record Payment
              </button>
            </div>
          </div>

          {/* Invoice Form Modal */}
          {showInvoiceForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Generate Invoice</h3>
                <form onSubmit={handleGenerateInvoice}>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 font-semibold">Invoice Type</label>
                      <select
                        value={invoiceForm.type}
                        onChange={(e) => setInvoiceForm({...invoiceForm, type: e.target.value})}
                        className="w-full p-2 border rounded"
                        required
                      >
                        <option value="rental">Rental Payment</option>
                        <option value="maintenance">Maintenance Charges</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold">Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={invoiceForm.amount}
                        onChange={(e) => setInvoiceForm({...invoiceForm, amount: e.target.value})}
                        className="w-full p-2 border rounded"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold">Due Date</label>
                      <input
                        type="date"
                        value={invoiceForm.dueDate}
                        onChange={(e) => setInvoiceForm({...invoiceForm, dueDate: e.target.value})}
                        className="w-full p-2 border rounded"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold">Description</label>
                      <textarea
                        value={invoiceForm.description}
                        onChange={(e) => setInvoiceForm({...invoiceForm, description: e.target.value})}
                        className="w-full p-2 border rounded h-24 resize-vertical"
                        rows={3}
                        required
                        placeholder="e.g., Monthly rent for January 2024"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Generating...' : 'Generate Invoice'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInvoiceForm(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Payment Form Modal */}
          {showPaymentForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Record Payment</h3>
                <form onSubmit={handleRecordPayment}>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 font-semibold">Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                        className="w-full p-2 border rounded"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold">Payment Date</label>
                      <input
                        type="date"
                        value={paymentForm.paymentDate}
                        onChange={(e) => setPaymentForm({...paymentForm, paymentDate: e.target.value})}
                        className="w-full p-2 border rounded"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold">Payment Method</label>
                      <select
                        value={paymentForm.paymentMethod}
                        onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                        className="w-full p-2 border rounded"
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
                      <label className="block mb-1 font-semibold">Link to Invoice (Optional)</label>
                      <select
                        value={paymentForm.invoiceId}
                        onChange={(e) => setPaymentForm({...paymentForm, invoiceId: e.target.value})}
                        className="w-full p-2 border rounded"
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
                      <label className="block mb-1 font-semibold">Description (Optional)</label>
                      <textarea
                        value={paymentForm.description}
                        onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                        className="w-full p-2 border rounded h-24 resize-vertical"
                        rows={3}
                        placeholder="Additional notes about this payment..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Recording...' : 'Record Payment'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Invoices List */}
          <div className="bg-white shadow-md rounded mb-6 p-6">
            <h2 className="text-lg font-semibold mb-4">Invoices</h2>
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No invoices found for this property.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.map(invoice => {
                  const isOverdue = invoice.status === 'pending' && new Date(invoice.dueDate) < new Date();
                  return (
                    <div key={invoice.id} className={`border rounded p-4 ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-lg capitalize">{invoice.type}</h3>
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
                          <p className="text-lg font-semibold">{formatCurrency(invoice.amount)}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>Issue Date: {formatDate(invoice.issueDate)}</p>
                        <p>Due Date: {formatDate(invoice.dueDate)}</p>
                        {invoice.paidDate && <p>Paid Date: {formatDate(invoice.paidDate)}</p>}
                        {invoice.tenantName && <p>Tenant: {invoice.tenantName}</p>}
                        {invoice.tenantEmail && <p>Tenant Email: {invoice.tenantEmail}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payments List */}
          <div className="bg-white shadow-md rounded p-6">
            <h2 className="text-lg font-semibold mb-4">Payment History</h2>
            {payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No payments found for this property.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map(payment => (
                  <div key={payment.id} className="border border-gray-200 rounded p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{formatCurrency(payment.amount)}</h3>
                        <p className="text-gray-600 text-sm">{payment.description || 'No description'}</p>
                        <div className="text-xs text-gray-500 mt-2 space-y-1">
                          <p>Method: {payment.paymentMethod.replace('_', ' ')}</p>
                          <p>Payment Date: {formatDate(payment.paymentDate)}</p>
                          <p>Recorded: {formatDate(payment.recordedDate)}</p>
                          {payment.invoiceId && <p>Linked to Invoice ID: {payment.invoiceId}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeletePayment(payment.id)}
                        className="ml-4 text-red-600 hover:text-red-800 text-sm"
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
        <div className="text-center py-8 text-gray-500">
          <p>Select a property to view and manage payments and invoices.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;