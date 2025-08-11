<<<<<<< HEAD
// example_test.js - Test Suite for Flat Controller

const { 
  getFlats, 
  addFlat, 
  updateFlat, 
  deleteFlat, 
  deleteImage, 
  getPublicFlats 
} = require('../controllers/flatController'); // Adjust path as needed

=======
const chai = require('chai');
const chaiHttp = require('chai-http');
const http = require('http');
const app = require('../server'); 
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const sinon = require('sinon');
>>>>>>> 7d450acacafea918301d7c4c0408c22054fa6293
const Flat = require('../models/Flat');

// Mock the Flat model
jest.mock('../models/Flat');

<<<<<<< HEAD
describe('Flat Controller Tests', () => {
  let req, res, next;

  beforeEach(() => {
    // Mock request and response objects
    req = {
      user: { id: 'user123' },
      body: {},
      params: {},
      files: []
    };
    
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    
    next = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  // 2 tests for addFlat
  describe('addFlat', () => {
    test('should successfully add a new flat with valid data', async () => {
      req.body = {
        title: 'Beautiful 2BR Apartment',
        description: 'Spacious apartment with great view',
        inspectionDate: '2024-08-15'
      };
      req.files = [
        { filename: 'image1.jpg' },
        { filename: 'image2.jpg' }
      ];

      const mockFlat = {
        _id: 'flat123',
        userId: 'user123',
        title: 'Beautiful 2BR Apartment',
        description: 'Spacious apartment with great view',
        inspectionDate: '2024-08-15',
        images: ['image1.jpg', 'image2.jpg']
      };

      Flat.create.mockResolvedValue(mockFlat);

      await addFlat(req, res);

      expect(Flat.create).toHaveBeenCalledWith({
        userId: 'user123',
        title: 'Beautiful 2BR Apartment',
        description: 'Spacious apartment with great view',
        inspectionDate: '2024-08-15',
        images: ['image1.jpg', 'image2.jpg']
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockFlat);
    });

    test('should return 400 error when title is missing', async () => {
      req.body = {
        description: 'Apartment without title'
      };

      await addFlat(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Title is required' });
      expect(Flat.create).not.toHaveBeenCalled();
    });
  });

  // 3 tests for updateFlat
  describe('updateFlat', () => {
    test('should successfully update existing flat with valid data', async () => {
      req.params.id = 'flat123';
      req.body = {
        title: 'Updated Apartment Title',
        description: 'Updated description',
        vacant: true,
        tenantDetails: 'New tenant info'
      };

      const mockFlat = {
        _id: 'flat123',
        title: 'Old Title',
        description: 'Old description',
        vacant: false,
        tenantDetails: 'Old tenant',
        images: ['old1.jpg'],
        save: jest.fn().mockResolvedValue({
          _id: 'flat123',
          title: 'Updated Apartment Title',
          description: 'Updated description',
          vacant: true,
          tenantDetails: 'New tenant info',
          images: ['old1.jpg']
        })
      };

      Flat.findById.mockResolvedValue(mockFlat);

      await updateFlat(req, res);

      expect(Flat.findById).toHaveBeenCalledWith('flat123');
      expect(mockFlat.title).toBe('Updated Apartment Title');
      expect(mockFlat.description).toBe('Updated description');
      expect(mockFlat.vacant).toBe(true);
      expect(mockFlat.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    test('should return 404 when flat is not found', async () => {
      req.params.id = 'nonexistent123';
      req.body = { title: 'Updated Title' };

      Flat.findById.mockResolvedValue(null);

      await updateFlat(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Flat not found' });
    });

    test('should handle new images upload correctly', async () => {
      req.params.id = 'flat123';
      req.body = { title: 'Updated Title' };
      req.files = [
        { filename: 'newimage1.jpg' },
        { filename: 'newimage2.jpg' }
      ];

      const mockFlat = {
        _id: 'flat123',
        title: 'Old Title',
        images: ['old1.jpg', 'old2.jpg'],
        save: jest.fn().mockResolvedValue({})
      };

      Flat.findById.mockResolvedValue(mockFlat);

      await updateFlat(req, res);

      expect(mockFlat.images).toEqual([
        'old1.jpg', 
        'old2.jpg', 
        'newimage1.jpg', 
        'newimage2.jpg'
      ]);
      expect(mockFlat.save).toHaveBeenCalled();
    });
  });

  // 3 tests for getFlats (view all user flats)
  describe('getFlats', () => {
    test('should successfully retrieve all flats for authenticated user', async () => {
      const mockFlats = [
        { _id: 'flat1', title: 'Flat 1', userId: 'user123' },
        { _id: 'flat2', title: 'Flat 2', userId: 'user123' }
      ];

      Flat.find.mockResolvedValue(mockFlats);

      await getFlats(req, res);

      expect(Flat.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(res.json).toHaveBeenCalledWith(mockFlats);
    });

    test('should return empty array when user has no flats', async () => {
      Flat.find.mockResolvedValue([]);

      await getFlats(req, res);

      expect(Flat.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(res.json).toHaveBeenCalledWith([]);
    });

    test('should handle database error gracefully', async () => {
      const errorMessage = 'Database connection failed';
      Flat.find.mockRejectedValue(new Error(errorMessage));

      await getFlats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  // 3 tests for deleteFlat
  describe('deleteFlat', () => {
    test('should successfully delete existing flat', async () => {
      req.params.id = 'flat123';

      const mockFlat = {
        _id: 'flat123',
        remove: jest.fn().mockResolvedValue()
      };

      Flat.findById.mockResolvedValue(mockFlat);

      await deleteFlat(req, res);

      expect(Flat.findById).toHaveBeenCalledWith('flat123');
      expect(mockFlat.remove).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Flat deleted' });
    });

    test('should return 404 when trying to delete non-existent flat', async () => {
      req.params.id = 'nonexistent123';

      Flat.findById.mockResolvedValue(null);

      await deleteFlat(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Flat not found' });
    });

    test('should handle database error during deletion', async () => {
      req.params.id = 'flat123';
      const errorMessage = 'Database error during deletion';

      const mockFlat = {
        _id: 'flat123',
        remove: jest.fn().mockRejectedValue(new Error(errorMessage))
      };

      Flat.findById.mockResolvedValue(mockFlat);

      await deleteFlat(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  // 2 additional tests for getPublicFlats
  describe('getPublicFlats', () => {
    test('should successfully retrieve all public flats with user info', async () => {
      const mockFlats = [
        { _id: 'flat1', title: 'Public Flat 1', userId: { name: 'John', email: 'john@example.com' } },
        { _id: 'flat2', title: 'Public Flat 2', userId: { name: 'Jane', email: 'jane@example.com' } }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockFlats)
      };

      Flat.find.mockReturnValue(mockQuery);

      await getPublicFlats(req, res);

      expect(Flat.find).toHaveBeenCalledWith();
      expect(mockQuery.populate).toHaveBeenCalledWith('userId', 'name email');
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.json).toHaveBeenCalledWith(mockFlats);
    });

    test('should handle error when retrieving public flats', async () => {
      const errorMessage = 'Failed to fetch public flats';
      
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error(errorMessage))
      };

      Flat.find.mockReturnValue(mockQuery);

      await getPublicFlats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  // 3 tests for deleteImage
  describe('deleteImage', () => {
    test('should successfully delete image from flat', async () => {
      req.params = { id: 'flat123', imageName: 'image1.jpg' };
      req.user = { id: 'user123' };

      const mockFlat = {
        _id: 'flat123',
        userId: 'user123',
        images: ['image1.jpg', 'image2.jpg'],
        save: jest.fn().mockResolvedValue()
      };

      Flat.findById.mockResolvedValue(mockFlat);

      await deleteImage(req, res);

      expect(mockFlat.images).toEqual(['image2.jpg']);
      expect(mockFlat.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Image deleted successfully', 
        flat: mockFlat 
      });
    });

    test('should return 404 when flat is not found', async () => {
      req.params = { id: 'nonexistent123', imageName: 'image1.jpg' };

      Flat.findById.mockResolvedValue(null);

      await deleteImage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Flat not found' });
    });

    test('should return 403 when user is not authorized', async () => {
      req.params = { id: 'flat123', imageName: 'image1.jpg' };
      req.user = { id: 'user456' }; // Different user

      const mockFlat = {
        _id: 'flat123',
        userId: 'user123', // Original owner
        toString: () => 'user123'
      };

      // Mock toString method properly
      mockFlat.userId.toString = jest.fn().mockReturnValue('user123');

      Flat.findById.mockResolvedValue(mockFlat);

      await deleteImage(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Not authorized to delete this image' 
      });
    });
  });
});

// Test setup and cleanup
beforeAll(() => {
  // Setup test environment
  console.log('Setting up Flat Controller tests...');
});

afterAll(() => {
  // Cleanup after all tests
  console.log('Cleaning up Flat Controller tests...');
=======
describe('AddFlat Function Test', () => {
  afterEach(() => sinon.restore());

  it('should create a new flat successfully', async () => {
    // Mock request data
    const req = {
      user: { id: new mongoose.Types.ObjectId() },
      body: { title: "New Flat", description: "Flat description", inspectionDate: "2025-12-31" },
      files: [] // Add files array for image uploads
    };

    // Mock flat that would be created
    const createdFlat = { _id: new mongoose.Types.ObjectId(), ...req.body, userId: req.user.id };

    // Stub Flat.create to return the createdFlat
    const createStub = sinon.stub(Flat, 'create').resolves(createdFlat);

    // Mock response object
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    // Call function
    await addFlat(req, res);

    // Assertions
    expect(createStub.calledOnceWith({ userId: req.user.id, ...req.body, images: [] })).to.be.true;
    expect(res.status.calledWith(201)).to.be.true;
    expect(res.json.calledWith(createdFlat)).to.be.true;

    // Restore stubbed methods
    createStub.restore();
  });

  it('should return 500 if an error occurs', async () => {
    // Stub Flat.create to throw an error
    const createStub = sinon.stub(Flat, 'create').throws(new Error('DB Error'));

    // Mock request data
    const req = {
      user: { id: new mongoose.Types.ObjectId() },
      body: { title: "New Flat", description: "Flat description", inspectionDate: "2025-12-31" },
      files: []
    };

    // Mock response object
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    // Call function
    await addFlat(req, res);

    // Assertions
    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;

    // Restore stubbed methods
    createStub.restore();
  });
});

describe('Update Function Test', () => {
  afterEach(() => sinon.restore());

  it('should update flat successfully', async () => {
    // Mock flat data
    const flatId = new mongoose.Types.ObjectId();
    const existingFlat = {
      _id: flatId,
      title: "Old Flat",
      description: "Old Description",
      vacant: false,
      inspectionDate: new Date(),
      images: [],
      save: sinon.stub().resolvesThis(), // Mock save method
    };
    
    // Stub Flat.findById to return mock flat
    const findByIdStub = sinon.stub(Flat, 'findById').resolves(existingFlat);

    // Mock request & response
    const req = {
      params: { id: flatId },
      body: { title: "New Flat", vacant: true },
      files: [] // Add files array
    };
    const res = {
      json: sinon.spy(), 
      status: sinon.stub().returnsThis()
    };

    // Call function
    await updateFlat(req, res);

    // Assertions
    expect(existingFlat.title).to.equal("New Flat");
    expect(existingFlat.vacant).to.equal(true);
    expect(res.status.called).to.be.false; // No error status should be set
    expect(res.json.calledOnce).to.be.true;

    // Restore stubbed methods
    findByIdStub.restore();
  });

  it('should return 404 if flat is not found', async () => {
    const findByIdStub = sinon.stub(Flat, 'findById').resolves(null);

    const req = { 
      params: { id: new mongoose.Types.ObjectId() }, 
      body: { title: "Test Flat" }, // Add some body data
      files: [] // Add files array
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    await updateFlat(req, res);

    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Flat not found' })).to.be.true;

    findByIdStub.restore();
  });

  it('should return 500 on error', async () => {
    // Make sure findById throws the error BEFORE any processing
    const findByIdStub = sinon.stub(Flat, 'findById').throws(new Error('DB Error'));

    const req = { 
      params: { id: new mongoose.Types.ObjectId() }, 
      body: { 
        title: "Test Flat",           // ✅ Add proper body data
        description: "Test Desc",     // ✅ Add description  
        vacant: true,                 // ✅ Add vacant status
        inspectionDate: "2025-12-31", // ✅ Add inspection date
        tenantDetails: null           // ✅ Add tenant details
      },
      files: [] // ✅ Add files array
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    await updateFlat(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.called).to.be.true;

    findByIdStub.restore();
  });
});

describe('GetFlat Function Test', () => {
  afterEach(() => sinon.restore());

  it('should return flats for the given user', async () => {
    // Mock user ID
    const userId = new mongoose.Types.ObjectId();

    // Mock flat data
    const flats = [
      { _id: new mongoose.Types.ObjectId(), title: "Flat 1", userId },
      { _id: new mongoose.Types.ObjectId(), title: "Flat 2", userId }
    ];

    // Stub Flat.find to return mock flats
    const findStub = sinon.stub(Flat, 'find').resolves(flats);

    // Mock request & response
    const req = { user: { id: userId } };
    const res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis()
    };

    // Call function
    await getFlats(req, res);

    // Assertions
    expect(findStub.calledOnceWith({ userId })).to.be.true;
    expect(res.json.calledWith(flats)).to.be.true;
    expect(res.status.called).to.be.false; // No error status should be set

    // Restore stubbed methods
    findStub.restore();
  });

  it('should return 500 on error', async () => {
    // Stub Flat.find to throw an error
    const findStub = sinon.stub(Flat, 'find').throws(new Error('DB Error'));

    // Mock request & response
    const req = { user: { id: new mongoose.Types.ObjectId() } };
    const res = {
      json: sinon.spy(),
      status: sinon.stub().returnsThis()
    };

    // Call function
    await getFlats(req, res);

    // Assertions
    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;

    // Restore stubbed methods
    findStub.restore();
  });
});

describe('DeleteFlat Function Test', () => {
  afterEach(() => sinon.restore());

  it('should delete a flat successfully', async () => {
    // Mock request data
    const req = { params: { id: new mongoose.Types.ObjectId().toString() } };

    // Mock flat found in the database
    const flat = { remove: sinon.stub().resolves() };

    // Stub Flat.findById to return the mock flat
    const findByIdStub = sinon.stub(Flat, 'findById').resolves(flat);

    // Mock response object
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    // Call function
    await deleteFlat(req, res);

    // Assertions
    expect(findByIdStub.calledOnceWith(req.params.id)).to.be.true;
    expect(flat.remove.calledOnce).to.be.true;
    expect(res.json.calledWith({ message: 'Flat deleted' })).to.be.true;

    // Restore stubbed methods
    findByIdStub.restore();
  });

  it('should return 404 if flat is not found', async () => {
    // Stub Flat.findById to return null
    const findByIdStub = sinon.stub(Flat, 'findById').resolves(null);

    // Mock request data
    const req = { params: { id: new mongoose.Types.ObjectId().toString() } };

    // Mock response object
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    // Call function
    await deleteFlat(req, res);

    // Assertions
    expect(findByIdStub.calledOnceWith(req.params.id)).to.be.true;
    expect(res.status.calledWith(404)).to.be.true;
    expect(res.json.calledWith({ message: 'Flat not found' })).to.be.true;

    // Restore stubbed methods
    findByIdStub.restore();
  });

  it('should return 500 if an error occurs', async () => {
    // Stub Flat.findById to throw an error
    const findByIdStub = sinon.stub(Flat, 'findById').throws(new Error('DB Error'));

    // Mock request data
    const req = { params: { id: new mongoose.Types.ObjectId().toString() } };

    // Mock response object
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };

    // Call function
    await deleteFlat(req, res);

    // Assertions
    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;

    // Restore stubbed methods
    findByIdStub.restore();
  });
>>>>>>> 7d450acacafea918301d7c4c0408c22054fa6293
});