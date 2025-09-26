// test/payment-maintenance.test.js

const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const fs = require('fs');
const Flat = require('../models/Flat');

// Import payment controller functions
const {
  generateInvoice,
  recordPayment,
  getPaymentLogs,
  deletePayment,
  getArrearsTracking,
  getInvoices
} = require('../controllers/paymentController');

// Import maintenance controller functions
const {
  reportMaintenance,
  getMaintenanceReports,
  updateMaintenanceStatus,
  getAllMaintenanceReports,
  getContractors,
  deleteMaintenanceReport
} = require('../controllers/maintenanceController');

describe('Payment and Maintenance Controllers Test Suite', () => {
  let req, res, stub;
  
  beforeEach(() => {
    res = { 
      status: sinon.stub().returnsThis(), 
      json: sinon.spy() 
    };
    stub = { 
      log: sinon.stub(console, 'log'), 
      error: sinon.stub(console, 'error') 
    };
  });
  
  afterEach(() => sinon.restore());

  // Helper functions
  const mockReq = (p = {}, b = {}, u = { id: new mongoose.Types.ObjectId().toString() }) => 
    ({ params: p, body: b, user: u, files: p.files || [] });

  const mockFlat = (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    title: 'Test Flat',
    tenantDetails: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    invoices: [],
    paymentLogs: [],
    maintenanceReports: [],
    save: sinon.stub().resolvesThis(),
    ...overrides
  });

  const mockInvoice = {
    type: 'rental',
    amount: 1500,
    dueDate: '2024-02-01'
  };

  const mockPayment = {
    amount: 1500,
    paymentDate: '2024-01-15',
    paymentMethod: 'bank_transfer',
    description: 'Monthly rent'
  };

  const mockMaintenance = {
    issueType: 'plumbing',
    description: 'Leaky faucet in kitchen',
    priority: 'medium',
    contractorId: '1'
  };

  // ================== PAYMENT CONTROLLER TESTS ==================
  describe('Payment Controller Tests', () => {
    const flatId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId().toString();

    describe('generateInvoice function tests', () => {
      it('generates rental invoice successfully', async () => {
        const flat = mockFlat({ 
          _id: flatId, 
          userId: new mongoose.Types.ObjectId(userId),
          invoices: []
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, mockInvoice, { id: userId });
        
        await generateInvoice(req, res);
        
        expect(flat.invoices.length).to.equal(1);
        expect(flat.invoices[0].type).to.equal('rental');
        expect(flat.invoices[0].amount).to.equal(1500);
        expect(res.status.calledWith(201)).to.be.true;
        expect(flat.save.calledOnce).to.be.true;
      });

      it('generates maintenance invoice successfully', async () => {
        const maintenanceInvoice = {
          type: 'maintenance',
          amount: 500,
          dueDate: '2024-02-01',
          description: 'Repair work'
        };
        const flat = mockFlat({ 
          _id: flatId, 
          userId: new mongoose.Types.ObjectId(userId),
          invoices: []
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, maintenanceInvoice, { id: userId });
        
        await generateInvoice(req, res);
        
        expect(flat.invoices.length).to.equal(1);
        expect(flat.invoices[0].type).to.equal('maintenance');
        expect(flat.invoices[0].description).to.equal('Repair work');
        expect(res.status.calledWith(201)).to.be.true;
      });

      it('fails with invalid amount (negative)', async () => {
        req = mockReq({ flatId }, { ...mockInvoice, amount: -100 }, { id: userId });
        
        await generateInvoice(req, res);
        
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Amount is required and must be greater than 0' })).to.be.true;
      });

      it('fails with invalid amount (zero)', async () => {
        req = mockReq({ flatId }, { ...mockInvoice, amount: 0 }, { id: userId });
        
        await generateInvoice(req, res);
        
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Amount is required and must be greater than 0' })).to.be.true;
      });

      it('fails without due date', async () => {
        req = mockReq({ flatId }, { type: 'rental', amount: 1500 }, { id: userId });
        
        await generateInvoice(req, res);
        
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Due date is required' })).to.be.true;
      });

      it('fails with invalid invoice type', async () => {
        req = mockReq({ flatId }, { type: 'invalid', amount: 1500, dueDate: '2024-02-01' }, { id: userId });
        
        await generateInvoice(req, res);
        
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Valid invoice type is required' })).to.be.true;
      });
    });

    describe('recordPayment function tests', () => {
      it('records payment successfully', async () => {
        const flat = mockFlat({ 
          _id: flatId, 
          userId: new mongoose.Types.ObjectId(userId),
          paymentLogs: []
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, mockPayment, { id: userId });
        
        await recordPayment(req, res);
        
        expect(flat.paymentLogs.length).to.equal(1);
        expect(flat.paymentLogs[0].amount).to.equal(1500);
        expect(flat.paymentLogs[0].paymentMethod).to.equal('bank_transfer');
        expect(res.status.calledWith(201)).to.be.true;
        expect(flat.save.calledOnce).to.be.true;
      });

      it('records payment and updates invoice status', async () => {
        const existingInvoice = {
          id: 'inv123',
          amount: 1500,
          status: 'pending'
        };
        const flat = mockFlat({ 
          _id: flatId, 
          userId: new mongoose.Types.ObjectId(userId),
          paymentLogs: [],
          invoices: [existingInvoice]
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, { ...mockPayment, invoiceId: 'inv123' }, { id: userId });
        
        await recordPayment(req, res);
        
        expect(flat.paymentLogs.length).to.equal(1);
        expect(flat.invoices[0].status).to.equal('paid');
        expect(flat.invoices[0].paidDate).to.exist;
        expect(res.status.calledWith(201)).to.be.true;
      });

      it('fails with invalid payment amount', async () => {
        req = mockReq({ flatId }, { ...mockPayment, amount: 0 }, { id: userId });
        
        await recordPayment(req, res);
        
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Amount is required and must be greater than 0' })).to.be.true;
      });

      it('fails without payment date', async () => {
        req = mockReq({ flatId }, { amount: 1500, paymentMethod: 'cash' }, { id: userId });
        
        await recordPayment(req, res);
        
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Payment date is required' })).to.be.true;
      });

      it('fails without payment method', async () => {
        req = mockReq({ flatId }, { amount: 1500, paymentDate: '2024-01-15' }, { id: userId });
        
        await recordPayment(req, res);
        
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Payment method is required' })).to.be.true;
      });
    });

    describe('getPaymentLogs function tests', () => {
      it('returns payment logs successfully', async () => {
        const paymentLog = { 
          id: 'pay123', 
          amount: 1500, 
          paymentMethod: 'bank_transfer',
          recordedDate: new Date()
        };
        const flat = mockFlat({ 
          _id: flatId, 
          userId: new mongoose.Types.ObjectId(userId),
          paymentLogs: [paymentLog]
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, {}, { id: userId });
        
        await getPaymentLogs(req, res);
        
        expect(res.json.calledWithMatch({ 
          flatId, 
          payments: [paymentLog] 
        })).to.be.true;
      });

      it('returns empty array when no payment logs found', async () => {
        const flat = mockFlat({ 
          userId: new mongoose.Types.ObjectId(userId),
          paymentLogs: []
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, {}, { id: userId });
        
        await getPaymentLogs(req, res);
        
        expect(res.json.calledWithMatch({ payments: [] })).to.be.true;
      });

      it('returns 403 for unauthorized access', async () => {
        const flat = mockFlat({ userId: new mongoose.Types.ObjectId() });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, {}, { id: 'different-user' });
        
        await getPaymentLogs(req, res);
        
        expect(res.status.calledWith(403)).to.be.true;
      });
    });

    describe('deletePayment function tests', () => {
      it('deletes payment successfully', async () => {
        const paymentLog = { id: 'pay123', amount: 1500 };
        const flat = mockFlat({ 
          userId: new mongoose.Types.ObjectId(userId),
          paymentLogs: [paymentLog]
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId, paymentId: 'pay123' }, {}, { id: userId });
        
        await deletePayment(req, res);
        
        expect(flat.paymentLogs.length).to.equal(0);
        expect(flat.save.calledOnce).to.be.true;
        expect(res.json.calledWithMatch({ message: 'Payment deleted successfully' })).to.be.true;
      });

      it('returns 404 for non-existent payment', async () => {
        const flat = mockFlat({ 
          userId: new mongoose.Types.ObjectId(userId),
          paymentLogs: []
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId, paymentId: 'nonexistent' }, {}, { id: userId });
        
        await deletePayment(req, res);
        
        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({ message: 'Payment not found' })).to.be.true;
      });
    });

    describe('getArrearsTracking function tests', () => {
      it('calculates arrears correctly for overdue invoices', async () => {
        const overdueDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
        const flats = [{
          _id: flatId,
          title: 'Test Flat',
          tenantDetails: {
            name: 'John Doe',
            email: 'john@example.com'
          },
          invoices: [
            { id: 'inv1', amount: 1500, status: 'pending', dueDate: overdueDate },
            { id: 'inv2', amount: 800, status: 'pending', dueDate: overdueDate }
          ]
        }];
        sinon.stub(Flat, 'find').resolves(flats);
        req = mockReq({}, {}, { id: userId });
        
        await getArrearsTracking(req, res);
        
        expect(res.json.calledWithMatch({ 
          totalFlatsInArrears: 1, 
          totalArrearsAmount: 2300 
        })).to.be.true;
      });

      it('returns zero arrears when no overdue invoices', async () => {
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days future
        const flats = [{
          _id: flatId,
          tenantDetails: { name: 'John Doe', email: 'john@example.com' },
          invoices: [{ amount: 1500, status: 'pending', dueDate: futureDate }]
        }];
        sinon.stub(Flat, 'find').resolves(flats);
        req = mockReq({}, {}, { id: userId });
        
        await getArrearsTracking(req, res);
        
        expect(res.json.calledWithMatch({ 
          totalFlatsInArrears: 0, 
          totalArrearsAmount: 0 
        })).to.be.true;
      });

      it('ignores paid invoices in arrears calculation', async () => {
        const overdueDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
        const flats = [{
          _id: flatId,
          tenantDetails: { name: 'John Doe', email: 'john@example.com' },
          invoices: [
            { amount: 1500, status: 'paid', dueDate: overdueDate },
            { amount: 800, status: 'pending', dueDate: overdueDate }
          ]
        }];
        sinon.stub(Flat, 'find').resolves(flats);
        req = mockReq({}, {}, { id: userId });
        
        await getArrearsTracking(req, res);
        
        expect(res.json.calledWithMatch({ 
          totalFlatsInArrears: 1, 
          totalArrearsAmount: 800 
        })).to.be.true;
      });
    });

    describe('getInvoices function tests', () => {
      it('returns invoices successfully', async () => {
        const invoice = { 
          id: 'inv123', 
          type: 'rental', 
          amount: 1500,
          issueDate: new Date()
        };
        const flat = mockFlat({ 
          _id: flatId, 
          userId: new mongoose.Types.ObjectId(userId),
          invoices: [invoice]
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, {}, { id: userId });
        
        await getInvoices(req, res);
        
        expect(res.json.calledWithMatch({ 
          flatId, 
          invoices: [invoice] 
        })).to.be.true;
      });

      it('returns empty array when no invoices found', async () => {
        const flat = mockFlat({ 
          userId: new mongoose.Types.ObjectId(userId),
          invoices: []
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, {}, { id: userId });
        
        await getInvoices(req, res);
        
        expect(res.json.calledWithMatch({ invoices: [] })).to.be.true;
      });
    });
  });

  // ================== MAINTENANCE CONTROLLER TESTS ==================
  describe('Maintenance Controller Tests', () => {
    const flatId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId().toString();

    describe('reportMaintenance function tests', () => {
      it('reports maintenance issue successfully', async () => {
        const flat = mockFlat({ 
          _id: flatId, 
          userId: new mongoose.Types.ObjectId(userId),
          maintenanceReports: []
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, mockMaintenance, { id: userId });
        req.files = [{ filename: 'maintenance.jpg' }];
        
        await reportMaintenance(req, res);
        
        expect(flat.maintenanceReports.length).to.equal(1);
        expect(flat.maintenanceReports[0].issueType).to.equal('plumbing');
        expect(flat.maintenanceReports[0].description).to.equal('Leaky faucet in kitchen');
        expect(flat.maintenanceReports[0].priority).to.equal('medium');
        expect(flat.maintenanceReports[0].status).to.equal('reported');
        expect(res.status.calledWith(201)).to.be.true;
      });

      it('fails without issue type', async () => {
        req = mockReq({ flatId }, { 
          description: 'Problem', 
          priority: 'high', 
          contractorId: '1' 
        }, { id: userId });
        
        await reportMaintenance(req, res);
        
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Issue type is required' })).to.be.true;
      });

      it('fails without description', async () => {
        req = mockReq({ flatId }, { 
          issueType: 'electrical', 
          priority: 'high', 
          contractorId: '1' 
        }, { id: userId });
        
        await reportMaintenance(req, res);
        
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Description is required' })).to.be.true;
      });

      it('fails without priority', async () => {
        req = mockReq({ flatId }, { 
          issueType: 'plumbing', 
          description: 'Leak', 
          contractorId: '1' 
        }, { id: userId });
        
        await reportMaintenance(req, res);
        
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Priority is required' })).to.be.true;
      });

      it('fails without contractor ID', async () => {
        req = mockReq({ flatId }, { 
          issueType: 'plumbing', 
          description: 'Leak', 
          priority: 'medium' 
        }, { id: userId });
        
        await reportMaintenance(req, res);
        
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Contractor selection is required' })).to.be.true;
      });

      it('fails with invalid contractor ID', async () => {
        const flat = mockFlat({ 
          _id: flatId, 
          userId: new mongoose.Types.ObjectId(userId)
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, { 
          ...mockMaintenance, 
          contractorId: 'invalid' 
        }, { id: userId });
        
        await reportMaintenance(req, res);
        
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Invalid contractor selected' })).to.be.true;
      });

      it('returns 403 for unauthorized access', async () => {
        const flat = mockFlat({ userId: new mongoose.Types.ObjectId() });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, mockMaintenance, { id: 'different-user' });
        
        await reportMaintenance(req, res);
        
        expect(res.status.calledWith(403)).to.be.true;
      });
    });

    describe('getMaintenanceReports function tests', () => {
      it('returns maintenance reports successfully', async () => {
        const maintenanceReport = { 
          id: 'report1', 
          issueType: 'plumbing',
          contractorId: '1',
          status: 'reported'
        };
        const flat = mockFlat({ 
          _id: flatId, 
          userId: new mongoose.Types.ObjectId(userId),
          maintenanceReports: [maintenanceReport]
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, {}, { id: userId });
        
        await getMaintenanceReports(req, res);
        
        expect(res.json.calledWithMatch({ 
          flatId, 
          reports: [sinon.match.object] 
        })).to.be.true;
      });

      it('returns empty array when no maintenance reports found', async () => {
        const flat = mockFlat({ 
          userId: new mongoose.Types.ObjectId(userId),
          maintenanceReports: []
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, {}, { id: userId });
        
        await getMaintenanceReports(req, res);
        
        expect(res.json.calledWithMatch({ reports: [] })).to.be.true;
      });

      it('returns 403 for unauthorized access', async () => {
        const flat = mockFlat({ userId: new mongoose.Types.ObjectId() });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, {}, { id: 'different-user' });
        
        await getMaintenanceReports(req, res);
        
        expect(res.status.calledWith(403)).to.be.true;
      });
    });

    describe('updateMaintenanceStatus function tests', () => {
      it('updates maintenance status successfully', async () => {
        const maintenanceReport = { 
          id: 'report1', 
          status: 'in_progress',
          actualCost: null
        };
        const flat = mockFlat({ 
          userId: new mongoose.Types.ObjectId(userId),
          maintenanceReports: [maintenanceReport]
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId, reportId: 'report1' }, { 
          status: 'completed', 
          actualCost: 250,
          completionDate: '2024-01-20',
          notes: 'Fixed successfully'
        }, { id: userId });
        
        await updateMaintenanceStatus(req, res);
        
        expect(flat.maintenanceReports[0].status).to.equal('completed');
        expect(flat.maintenanceReports[0].actualCost).to.equal(250);
        expect(flat.maintenanceReports[0].notes).to.equal('Fixed successfully');
        expect(res.json.calledWithMatch({ message: 'Maintenance status updated successfully' })).to.be.true;
      });

      it('returns 404 for non-existent maintenance report', async () => {
        const flat = mockFlat({ 
          userId: new mongoose.Types.ObjectId(userId),
          maintenanceReports: []
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId, reportId: 'nonexistent' }, { status: 'completed' }, { id: userId });
        
        await updateMaintenanceStatus(req, res);
        
        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({ message: 'Maintenance report not found' })).to.be.true;
      });

      it('returns 404 when no maintenance reports exist', async () => {
        const flat = mockFlat({ 
          userId: new mongoose.Types.ObjectId(userId),
          maintenanceReports: null
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId, reportId: 'report1' }, { status: 'completed' }, { id: userId });
        
        await updateMaintenanceStatus(req, res);
        
        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({ message: 'No maintenance reports found for this flat' })).to.be.true;
      });
    });

    describe('getAllMaintenanceReports function tests', () => {
      it('returns all maintenance reports for user', async () => {
        const flats = [
          mockFlat({ 
            title: 'Flat 1',
            maintenanceReports: [{ id: 'report1', issueType: 'plumbing', contractorId: '1' }]
          }),
          mockFlat({ 
            title: 'Flat 2',
            maintenanceReports: [{ id: 'report2', issueType: 'electrical', contractorId: '2' }]
          })
        ];
        sinon.stub(Flat, 'find').resolves(flats);
        req = mockReq({}, {}, { id: userId });
        
        await getAllMaintenanceReports(req, res);
        
        expect(res.json.calledWithMatch({ 
          totalReports: 2,
          message: 'All maintenance reports retrieved successfully'
        })).to.be.true;
      });

      it('returns empty array when no maintenance reports found', async () => {
        sinon.stub(Flat, 'find').resolves([]);
        req = mockReq({}, {}, { id: userId });
        
        await getAllMaintenanceReports(req, res);
        
        expect(res.json.calledWithMatch({ 
          totalReports: 0, 
          reports: [] 
        })).to.be.true;
      });

      it('handles database errors', async () => {
        sinon.stub(Flat, 'find').throws(new Error('Database error'));
        req = mockReq({}, {}, { id: userId });
        
        await getAllMaintenanceReports(req, res);
        
        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWith({ message: 'Database error' })).to.be.true;
      });
    });

    describe('getContractors function tests', () => {
      it('returns contractors list successfully', async () => {
        req = mockReq({}, {}, { id: userId });
        
        await getContractors(req, res);
        
        expect(res.json.calledWithMatch({ 
          message: 'Contractors retrieved successfully',
          contractors: sinon.match.array
        })).to.be.true;
      });

      it('verifies contractors data structure', async () => {
        req = mockReq({}, {}, { id: userId });
        
        await getContractors(req, res);
        
        expect(res.json.called).to.be.true;
        const responseData = res.json.args[0][0];
        expect(responseData.contractors).to.be.an('array');
        expect(responseData.contractors.length).to.be.greaterThan(0);
        // Verify contractor has required fields
        expect(responseData.contractors[0]).to.have.property('id');
        expect(responseData.contractors[0]).to.have.property('name');
        expect(responseData.contractors[0]).to.have.property('specialization');
      });
    });

    describe('deleteMaintenanceReport function tests', () => {
      it('deletes maintenance report successfully', async () => {
        const maintenanceReport = { 
          id: 'report1', 
          issueType: 'plumbing',
          images: ['maintenance1.jpg', 'maintenance2.jpg']
        };
        const flat = mockFlat({ 
          userId: new mongoose.Types.ObjectId(userId),
          maintenanceReports: [maintenanceReport]
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        sinon.stub(fs, 'unlink').yields(null);
        req = mockReq({ flatId, reportId: 'report1' }, {}, { id: userId });
        
        await deleteMaintenanceReport(req, res);
        
        expect(flat.maintenanceReports.length).to.equal(0);
        expect(flat.save.calledOnce).to.be.true;
        expect(res.json.calledWithMatch({ message: 'Maintenance report deleted successfully' })).to.be.true;
      });

      it('deletes maintenance report without images', async () => {
        const maintenanceReport = { 
          id: 'report1', 
          issueType: 'electrical',
          images: []
        };
        const flat = mockFlat({ 
          userId: new mongoose.Types.ObjectId(userId),
          maintenanceReports: [maintenanceReport]
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId, reportId: 'report1' }, {}, { id: userId });
        
        await deleteMaintenanceReport(req, res);
        
        expect(flat.maintenanceReports.length).to.equal(0);
        expect(res.json.calledWithMatch({ message: 'Maintenance report deleted successfully' })).to.be.true;
      });

      it('returns 404 for non-existent maintenance report', async () => {
        const flat = mockFlat({ 
          userId: new mongoose.Types.ObjectId(userId),
          maintenanceReports: []
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId, reportId: 'nonexistent' }, {}, { id: userId });
        
        await deleteMaintenanceReport(req, res);
        
        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({ message: 'Maintenance report not found' })).to.be.true;
      });

      it('returns 404 when no maintenance reports exist', async () => {
        const flat = mockFlat({ 
          userId: new mongoose.Types.ObjectId(userId),
          maintenanceReports: null
        });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId, reportId: 'report1' }, {}, { id: userId });
        
        await deleteMaintenanceReport(req, res);
        
        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({ message: 'No maintenance reports found for this flat' })).to.be.true;
      });

      it('returns 403 for unauthorized access', async () => {
        const flat = mockFlat({ userId: new mongoose.Types.ObjectId() });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId, reportId: 'report1' }, {}, { id: 'different-user' });
        
        await deleteMaintenanceReport(req, res);
        
        expect(res.status.calledWith(403)).to.be.true;
      });
    });
  });

  // ================== ERROR HANDLING TESTS ==================
  describe('Error Handling Tests for Payment and Maintenance', () => {
    it('handles database errors in payment operations', async () => {
      sinon.stub(Flat, 'findById').throws(new Error('Database connection failed'));
      req = mockReq({ flatId: new mongoose.Types.ObjectId() }, mockPayment);
      
      await recordPayment(req, res);
      
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'Database connection failed' })).to.be.true;
    });

    it('handles database errors in maintenance operations', async () => {
      sinon.stub(Flat, 'findById').throws(new Error('Database connection failed'));
      req = mockReq({ flatId: new mongoose.Types.ObjectId() }, mockMaintenance);
      
      await reportMaintenance(req, res);
      
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'Database connection failed' })).to.be.true;
    });

    it('handles file system errors during maintenance image deletion', async () => {
      const maintenanceReport = { 
        id: 'report1', 
        images: ['test.jpg']
      };
      const flat = mockFlat({ 
        userId: new mongoose.Types.ObjectId(),
        maintenanceReports: [maintenanceReport]
      });
      sinon.stub(Flat, 'findById').resolves(flat);
      sinon.stub(fs, 'unlink').yields(new Error('File system error'));
      req = mockReq({ flatId: flat._id, reportId: 'report1' }, {}, { id: flat.userId.toString() });
      
      await deleteMaintenanceReport(req, res);
      
      // Should still delete the record even if file deletion fails
      expect(flat.maintenanceReports.length).to.equal(0);
      expect(res.json.calledWithMatch({ message: 'Maintenance report deleted successfully' })).to.be.true;
    });
  });

  // ================== INTEGRATION TESTS ==================
  describe('Integration Tests', () => {
    it('complete payment workflow - generate invoice, record payment, track arrears', async () => {
      const flatId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId().toString();
      const flat = mockFlat({ 
        _id: flatId, 
        userId: new mongoose.Types.ObjectId(userId),
        invoices: [],
        paymentLogs: []
      });
      
      sinon.stub(Flat, 'findById').resolves(flat);
      sinon.stub(Flat, 'find').resolves([flat]);
      
      // 1. Generate invoice
      req = mockReq({ flatId }, mockInvoice, { id: userId });
      await generateInvoice(req, res);
      expect(flat.invoices.length).to.equal(1);
      expect(flat.invoices[0].type).to.equal('rental');
      
      // 2. Record payment linking to invoice
      const invoiceId = flat.invoices[0].id;
      req = mockReq({ flatId }, { ...mockPayment, invoiceId }, { id: userId });
      await recordPayment(req, res);
      expect(flat.paymentLogs.length).to.equal(1);
      expect(flat.invoices[0].status).to.equal('paid');
      
      // 3. Check arrears (should be zero since invoice is paid)
      req = mockReq({}, {}, { id: userId });
      await getArrearsTracking(req, res);
      expect(res.json.calledWithMatch({ totalArrearsAmount: 0 })).to.be.true;
    });

    it('complete maintenance workflow - report, update, delete', async () => {
      const flatId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId().toString();
      const flat = mockFlat({ 
        _id: flatId, 
        userId: new mongoose.Types.ObjectId(userId),
        maintenanceReports: []
      });
      
      sinon.stub(Flat, 'findById').resolves(flat);
      sinon.stub(fs, 'unlink').yields(null);
      
      // 1. Report maintenance issue
      req = mockReq({ flatId }, mockMaintenance, { id: userId });
      req.files = [{ filename: 'issue.jpg' }];
      await reportMaintenance(req, res);
      expect(flat.maintenanceReports.length).to.equal(1);
      expect(flat.maintenanceReports[0].status).to.equal('reported');
      
      // 2. Update maintenance status
      const reportId = flat.maintenanceReports[0].id;
      req = mockReq({ flatId, reportId }, { 
        status: 'completed', 
        actualCost: 300 
      }, { id: userId });
      await updateMaintenanceStatus(req, res);
      expect(flat.maintenanceReports[0].status).to.equal('completed');
      expect(flat.maintenanceReports[0].actualCost).to.equal(300);
      
      // 3. Delete maintenance report
      req = mockReq({ flatId, reportId }, {}, { id: userId });
      await deleteMaintenanceReport(req, res);
      expect(flat.maintenanceReports.length).to.equal(0);
    });

    it('mixed workflow - maintenance cost becomes invoice', async () => {
      const flatId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId().toString();
      const flat = mockFlat({ 
        _id: flatId, 
        userId: new mongoose.Types.ObjectId(userId),
        maintenanceReports: [],
        invoices: []
      });
      
      sinon.stub(Flat, 'findById').resolves(flat);
      
      // 1. Report maintenance
      req = mockReq({ flatId }, mockMaintenance, { id: userId });
      await reportMaintenance(req, res);
      expect(flat.maintenanceReports.length).to.equal(1);
      
      // 2. Update with actual cost
      const reportId = flat.maintenanceReports[0].id;
      req = mockReq({ flatId, reportId }, { 
        status: 'completed', 
        actualCost: 450 
      }, { id: userId });
      await updateMaintenanceStatus(req, res);
      
      // 3. Generate maintenance invoice based on actual cost
      req = mockReq({ flatId }, {
        type: 'maintenance',
        amount: 450,
        dueDate: '2024-03-01',
        description: 'Plumbing repair costs'
      }, { id: userId });
      await generateInvoice(req, res);
      expect(flat.invoices.length).to.equal(1);
      expect(flat.invoices[0].type).to.equal('maintenance');
      expect(flat.invoices[0].amount).to.equal(450);
    });
  });

  // ================== VALIDATION EDGE CASES ==================
  describe('Validation Edge Cases', () => {
    it('handles decimal amounts in payments', async () => {
      const flat = mockFlat({ userId: new mongoose.Types.ObjectId() });
      sinon.stub(Flat, 'findById').resolves(flat);
      req = mockReq({ flatId: flat._id }, {
        ...mockPayment,
        amount: 1500.50
      }, { id: flat.userId.toString() });
      
      await recordPayment(req, res);
      
      expect(res.status.calledWith(201)).to.be.true;
      expect(flat.paymentLogs[0].amount).to.equal(1500.50);
    });

    it('handles very large payment amounts', async () => {
      const flat = mockFlat({ userId: new mongoose.Types.ObjectId() });
      sinon.stub(Flat, 'findById').resolves(flat);
      req = mockReq({ flatId: flat._id }, {
        ...mockPayment,
        amount: 999999.99
      }, { id: flat.userId.toString() });
      
      await recordPayment(req, res);
      
      expect(res.status.calledWith(201)).to.be.true;
      expect(flat.paymentLogs[0].amount).to.equal(999999.99);
    });

    it('handles maintenance reports with minimal data', async () => {
      const flat = mockFlat({ userId: new mongoose.Types.ObjectId() });
      sinon.stub(Flat, 'findById').resolves(flat);
      req = mockReq({ flatId: flat._id }, {
        issueType: 'other',
        description: 'Minor issue',
        priority: 'low',
        contractorId: '5'
      }, { id: flat.userId.toString() });
      
      await reportMaintenance(req, res);
      
      expect(res.status.calledWith(201)).to.be.true;
      expect(flat.maintenanceReports[0].priority).to.equal('low');
    });

    it('handles empty description in payment', async () => {
      const flat = mockFlat({ userId: new mongoose.Types.ObjectId() });
      sinon.stub(Flat, 'findById').resolves(flat);
      req = mockReq({ flatId: flat._id }, {
        amount: 1000,
        paymentDate: '2024-01-15',
        paymentMethod: 'cash',
        description: ''
      }, { id: flat.userId.toString() });
      
      await recordPayment(req, res);
      
      expect(res.status.calledWith(201)).to.be.true;
      expect(flat.paymentLogs[0].description).to.equal('');
    });
  });
});