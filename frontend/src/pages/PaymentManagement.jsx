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

  // Fetch user's flats on component mount
  useEffect(() => {
    if (user) {
      fetchFlats();
      fetchArrearsData();
    }
  }, [user]);

  // Fetch payments and invoices when flat is selected
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return `$${Number(amount).toFixed(2)}`;
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
      <h1 className="text-2xl font-bold mb-6">Payment Management</h1>
      
      {/* Arrears Summary - matching your existing design pattern */}
      {arrearsData && (
        <div className="bg-white shadow-md rounded mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Arrears Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h3 className="text-sm font-medium text-red-600">Properties in Arrears</h3>
              <p className="text-2xl font-bold text-red-800">{arrearsData.totalFlatsInArrears}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded p-4">
              <h3 className="text-sm font-medium text-orange-600">Total Amount Due</h3>
              <p className="text-2xl font-bold text-orange-800">{formatCurrency(arrearsData.totalArrearsAmount)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h3 className="text-sm font-medium text-green-600">Properties Up to Date</h3>
              <p className="text-2xl font-bold text-green-800">{flats.length - arrearsData.totalFlatsInArrears}</p>
            </div>
          </div>
        </div>
      )}

      {/* Property Selection - matching your FlatForm style */}
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
          {/* Action Buttons - matching your existing button styles */}
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

          {/* Invoice Form Modal - matching your existing modal pattern */}
          {showInvoiceForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg max-w-md w-full mx-4">
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
                      <label className="block mb-1 font-semibold">Amount</label>
                      <input
                        type="number"
                        step="0.01"
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
              <div className="bg-white p-6 rounded shadow-lg max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Record Payment</h3>
                <form onSubmit={handleRecordPayment}>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 font-semibold">Amount</label>
                      <input
                        type="number"
                        step="0.01"
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
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold">Description</label>
                      <textarea
                        value={paymentForm.description}
                        onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                        className="w-full p-2 border rounded h-24 resize-vertical"
                        rows={3}
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

          {/* Invoices List - matching your FlatList design */}
          <div className="bg-white shadow-md rounded mb-6 p-6">
            <h2 className="text-lg font-semibold mb-4">Invoices</h2>
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No invoices found for this property.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.map(invoice => (
                  <div key={invoice.id} className="border border-gray-200 rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-lg capitalize">{invoice.type}</h3>
                        <p className="text-gray-600 text-sm">{invoice.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{formatCurrency(invoice.amount)}</p>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>Due: {formatDate(invoice.dueDate)}</p>
                      {invoice.paidDate && <p>Paid: {formatDate(invoice.paidDate)}</p>}
                    </div>
                  </div>
                ))}
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
                      <div>
                        <h3 className="font-medium text-lg">{formatCurrency(payment.amount)}</h3>
                        <p className="text-gray-600 text-sm">{payment.description}</p>
                        <p className="text-gray-500 text-xs">Method: {payment.paymentMethod.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>Paid: {formatDate(payment.paymentDate)}</p>
                        <p>Recorded: {formatDate(payment.recordedDate)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentManagement;