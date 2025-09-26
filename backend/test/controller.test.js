// test/controller-fixed.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const fs = require('fs');
const Flat = require('../models/Flat');

const { 
  getFlats, addFlat, updateFlat, deleteFlat, deleteImage, getPublicFlats,
  addTenant, getTenant, updateTenant, removeTenant, getAllTenants
} = require('../controllers/flatController');

describe('Backend Controllers Test Suite', () => {
  let req, res, stub;
  
  beforeEach(() => {
    // Simple response mock that matches your controller's separate calls
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

  const mockReq = (p = {}, b = {}, u = { id: new mongoose.Types.ObjectId().toString() }) => 
    ({ params: p, body: b, user: u, files: p.files || [] });

  const mockFlat = (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    title: 'Test Flat',
    description: 'Test Description',
    vacant: true,
    tenantDetails: null,
    images: [],
    maintenanceReports: [],
    paymentLogs: [],
    invoices: [],
    save: sinon.stub().resolvesThis(),
    remove: sinon.stub().resolves(),
    ...overrides
  });

  const mockTenant = { 
    name: 'John Doe', 
    email: 'john@example.com', 
    phone: '+1234567890', 
    moveInDate: '2024-01-01', 
    rentAmount: 1500 
  };

  // ================== FLAT CONTROLLER TESTS ==================
  describe('Flat Controller Tests', () => {
    
    describe('addFlat function tests', () => {
      it('creates flat successfully', async () => {
        req = mockReq({}, { 
          title: "2BR Apartment", 
          address: "123 Main Street",
          bedrooms: 2,
          bathrooms: 1,
          carpark: true,
          description: "Nice apartment"
        });
        req.files = [{ filename: 'img.jpg' }];
        const flat = { _id: new mongoose.Types.ObjectId(), ...req.body, images: ['img.jpg'] };
        sinon.stub(Flat, 'create').resolves(flat);
        
        await addFlat(req, res);
        
        expect(res.status.calledWith(201)).to.be.true;
        expect(res.json.calledWith(flat)).to.be.true;
      });

      it('fails without required address', async () => {
        req = mockReq({}, { 
          title: "Test", 
          bedrooms: 2,
          bathrooms: 1,
          carpark: true,
          description: "No address provided" 
        });
        
        await addFlat(req, res);
        
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Address is required' })).to.be.true;
      });

      it('fails without required bedrooms', async () => {
        req = mockReq({}, { 
          title: "Test", 
          address: "123 Main St",
          bathrooms: 1,
          carpark: true,
          description: "No bedrooms" 
        });
        
        await addFlat(req, res);
        
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Number of bedrooms is required' })).to.be.true;
      });

      it('fails without required bathrooms', async () => {
        req = mockReq({}, { 
          title: "Test", 
          address: "123 Main St",
          bedrooms: 2,
          carpark: true,
          description: "No bathrooms" 
        });
        
        await addFlat(req, res);
        
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Number of bathrooms is required' })).to.be.true;
      });

      it('fails without required carpark info', async () => {
        req = mockReq({}, { 
          title: "Test", 
          address: "123 Main St",
          bedrooms: 2,
          bathrooms: 1,
          description: "No carpark info" 
        });
        
        await addFlat(req, res);
        
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Carpark information is required' })).to.be.true;
      });

      it('handles database errors', async () => {
        req = mockReq({}, { 
          title: "Test Flat", 
          address: "123 Main Street",
          bedrooms: 3,
          bathrooms: 2,
          carpark: true,
          description: "Test description"
        });
        sinon.stub(Flat, 'create').throws(new Error('Database error'));
        
        await addFlat(req, res);
        
        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWith({ message: 'Database error' })).to.be.true;
      });
    });

    describe('getFlats function tests', () => {
      it('returns user flats successfully', async () => {
        const flats = [{ title: "Flat 1" }, { title: "Flat 2" }];
        sinon.stub(Flat, 'find').resolves(flats);
        req = mockReq();
        
        await getFlats(req, res);
        
        expect(res.json.calledWith(flats)).to.be.true;
      });

      it('handles database errors', async () => {
        sinon.stub(Flat, 'find').throws(new Error('Database error'));
        req = mockReq();
        
        await getFlats(req, res);
        
        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWith({ message: 'Database error' })).to.be.true;
      });
    });

    describe('updateFlat function tests', () => {
      it('updates flat successfully', async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const flat = mockFlat({ userId: new mongoose.Types.ObjectId(userId) });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ id: flat._id }, { title: "Updated Title", vacant: true }, { id: userId });
        
        await updateFlat(req, res);
        
        expect(flat.title).to.equal("Updated Title");
        expect(flat.vacant).to.be.true;
        expect(res.json.calledWith(flat)).to.be.true;
      });

      it('returns 404 for non-existent flat', async () => {
        sinon.stub(Flat, 'findById').resolves(null);
        req = mockReq({ id: new mongoose.Types.ObjectId() }, { title: "New Title" });
        
        await updateFlat(req, res);
        
        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({ message: 'Flat not found' })).to.be.true;
      });

      it('returns 403 for unauthorized access', async () => {
        const flat = mockFlat({ userId: new mongoose.Types.ObjectId() });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ id: flat._id }, { title: "Hacked" }, { id: 'different-user' });
        
        await updateFlat(req, res);
        
        expect(res.status.calledWith(403)).to.be.true;
        expect(res.json.calledWith({ message: 'Not authorized' })).to.be.true;
      });
    });

    describe('deleteFlat function tests', () => {
      it('deletes flat successfully', async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const flat = mockFlat({ userId: new mongoose.Types.ObjectId(userId) });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ id: flat._id }, {}, { id: userId });
        
        await deleteFlat(req, res);
        
        expect(flat.remove.calledOnce).to.be.true;
        expect(res.json.calledWith({ message: 'Flat deleted' })).to.be.true;
      });

      it('returns 404 for non-existent flat', async () => {
        sinon.stub(Flat, 'findById').resolves(null);
        req = mockReq({ id: new mongoose.Types.ObjectId() });
        
        await deleteFlat(req, res);
        
        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({ message: 'Flat not found' })).to.be.true;
      });
    });

    describe('deleteImage function tests', () => {
      it('deletes image successfully', async () => {
        const userId = new mongoose.Types.ObjectId();
        const flat = mockFlat({ userId, images: ['img1.jpg', 'img2.jpg'] });
        sinon.stub(Flat, 'findById').resolves(flat);
        sinon.stub(fs, 'unlink').yields(null);
        req = mockReq({ id: flat._id, imageName: 'img1.jpg' }, {}, { id: userId.toString() });
        
        await deleteImage(req, res);
        
        expect(flat.images).to.deep.equal(['img2.jpg']);
        expect(res.json.calledWithMatch({ message: 'Image deleted successfully' })).to.be.true;
      });

      it('returns 403 for unauthorized access', async () => {
        const flat = mockFlat({ userId: new mongoose.Types.ObjectId(), images: ['img.jpg'] });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ id: flat._id, imageName: 'img.jpg' });
        
        await deleteImage(req, res);
        
        expect(res.status.calledWith(403)).to.be.true;
        expect(res.json.calledWith({ message: 'Not authorized' })).to.be.true;
      });
    });

    describe('getPublicFlats function tests', () => {
      it('returns all public flats', async () => {
        const flats = [{ title: 'Public Flat 1' }, { title: 'Public Flat 2' }];
        sinon.stub(Flat, 'find').returns({
          populate: sinon.stub().returns({ sort: sinon.stub().resolves(flats) })
        });
        req = { query: {} };
        
        await getPublicFlats(req, res);
        
        expect(res.json.calledWith(flats)).to.be.true;
      });

      it('handles database errors', async () => {
        sinon.stub(Flat, 'find').throws(new Error('Database error'));
        req = { query: {} };
        
        await getPublicFlats(req, res);
        
        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWith({ message: 'Database error' })).to.be.true;
      });
    });
  });

  // ================== TENANT MANAGEMENT TESTS ==================
  describe('Tenant Management Tests', () => {
    const flatId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId().toString();

    describe('addTenant function tests', () => {
      it('adds tenant successfully', async () => {
        const flat = mockFlat({ _id: flatId, userId: new mongoose.Types.ObjectId(userId), vacant: true });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, mockTenant, { id: userId });
        
        await addTenant(req, res);
        
        expect(flat.tenantDetails.name).to.equal(mockTenant.name);
        expect(flat.vacant).to.be.false;
        expect(res.status.calledWith(201)).to.be.true;
      });

      it('fails without tenant name', async () => {
        req = mockReq({ flatId }, { email: 'test@test.com' });
        
        await addTenant(req, res);
        
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWith({ message: 'Tenant name is required' })).to.be.true;
      });

      it('fails when flat already has tenant', async () => {
        const flat = mockFlat({ userId: new mongoose.Types.ObjectId(userId), vacant: false, tenantDetails: mockTenant });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, mockTenant, { id: userId });
        
        await addTenant(req, res);
        
        expect(res.status.calledWith(400)).to.be.true;
      });

      it('returns 404 for non-existent flat', async () => {
        sinon.stub(Flat, 'findById').resolves(null);
        req = mockReq({ flatId }, mockTenant);
        
        await addTenant(req, res);
        
        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({ message: 'Flat not found' })).to.be.true;
      });
    });

    describe('getTenant function tests', () => {
      it('returns tenant details successfully', async () => {
        const flat = mockFlat({ _id: flatId, userId: new mongoose.Types.ObjectId(userId), tenantDetails: mockTenant });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, {}, { id: userId });
        
        await getTenant(req, res);
        
        expect(res.json.calledWithMatch({ flatId, tenant: mockTenant })).to.be.true;
      });

      it('returns 404 when no tenant found', async () => {
        const flat = mockFlat({ userId: new mongoose.Types.ObjectId(userId), tenantDetails: null });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, {}, { id: userId });
        
        await getTenant(req, res);
        
        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({ message: 'No tenant found for this flat' })).to.be.true;
      });

      it('returns 403 for unauthorized access', async () => {
        const flat = mockFlat({ userId: new mongoose.Types.ObjectId(), tenantDetails: mockTenant });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, {}, { id: 'different-user' });
        
        await getTenant(req, res);
        
        expect(res.status.calledWith(403)).to.be.true;
        expect(res.json.calledWith({ message: 'Not authorized' })).to.be.true;
      });
    });

    describe('updateTenant function tests', () => {
      it('updates tenant successfully', async () => {
        const flat = mockFlat({ userId: new mongoose.Types.ObjectId(userId), tenantDetails: { ...mockTenant } });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, { name: 'Jane Doe', rentAmount: 1600 }, { id: userId });
        
        await updateTenant(req, res);
        
        expect(flat.tenantDetails.name).to.equal('Jane Doe');
        expect(flat.tenantDetails.rentAmount).to.equal(1600);
        expect(res.json.calledWithMatch({ message: 'Tenant updated successfully' })).to.be.true;
      });

      it('returns 404 when no tenant to update', async () => {
        const flat = mockFlat({ userId: new mongoose.Types.ObjectId(userId), tenantDetails: null });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, { name: 'Jane Doe' }, { id: userId });
        
        await updateTenant(req, res);
        
        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({ message: 'No tenant found for this flat to update' })).to.be.true;
      });
    });

    describe('removeTenant function tests', () => {
      it('removes tenant successfully', async () => {
        const flat = mockFlat({ userId: new mongoose.Types.ObjectId(userId), vacant: false, tenantDetails: { ...mockTenant } });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, {}, { id: userId });
        
        await removeTenant(req, res);
        
        expect(flat.tenantDetails).to.be.null;
        expect(flat.vacant).to.be.true;
        expect(res.json.calledWithMatch({ message: 'Tenant removed successfully' })).to.be.true;
      });

      it('returns 404 when no tenant to remove', async () => {
        const flat = mockFlat({ userId: new mongoose.Types.ObjectId(userId), tenantDetails: null });
        sinon.stub(Flat, 'findById').resolves(flat);
        req = mockReq({ flatId }, {}, { id: userId });
        
        await removeTenant(req, res);
        
        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWith({ message: 'No tenant found for this flat' })).to.be.true;
      });
    });

    describe('getAllTenants function tests', () => {
      it('returns all tenants for user', async () => {
        const flats = [
          mockFlat({ title: 'Flat 1', tenantDetails: mockTenant }),
          mockFlat({ title: 'Flat 2', tenantDetails: { ...mockTenant, name: 'Jane Doe' } })
        ];
        sinon.stub(Flat, 'find').resolves(flats);
        req = mockReq();
        
        await getAllTenants(req, res);
        
        expect(res.json.calledWithMatch({ count: 2 })).to.be.true;
        expect(res.json.calledWithMatch({ message: 'Tenants retrieved successfully' })).to.be.true;
      });

      it('returns empty array when no tenants found', async () => {
        sinon.stub(Flat, 'find').resolves([]);
        req = mockReq();
        
        await getAllTenants(req, res);
        
        expect(res.json.calledWithMatch({ count: 0, tenants: [] })).to.be.true;
      });

      it('handles database errors', async () => {
        sinon.stub(Flat, 'find').throws(new Error('Database error'));
        req = mockReq();
        
        await getAllTenants(req, res);
        
        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWith({ message: 'Database error' })).to.be.true;
      });
    });
  });

  // ================== ERROR HANDLING TESTS ==================
  describe('Error Handling Tests', () => {
    it('handles database connection errors gracefully', async () => {
      sinon.stub(Flat, 'find').rejects(new Error('Database connection failed'));
      req = mockReq();
      
      await getFlats(req, res);
      
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'Database connection failed' })).to.be.true;
    });

    it('handles authorization errors properly', async () => {
      const flat = mockFlat({ userId: new mongoose.Types.ObjectId() });
      sinon.stub(Flat, 'findById').resolves(flat);
      req = mockReq({ id: flat._id }, { title: "Unauthorized update" });
      
      await updateFlat(req, res);
      
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'Not authorized' })).to.be.true;
    });

    it('handles validation errors correctly', async () => {
      req = mockReq({}, {}); // Empty body should trigger validation
      
      await addFlat(req, res);
      
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Address is required' })).to.be.true;
    });

    it('handles missing resources gracefully', async () => {
      sinon.stub(Flat, 'findById').resolves(null);
      req = mockReq({ id: new mongoose.Types.ObjectId() });
      
      await deleteFlat(req, res);
      
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Flat not found' })).to.be.true;
    });
  });
});