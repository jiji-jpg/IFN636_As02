// example_test.js - Test Suite for Flat Controller

const { 
  getFlats, 
  addFlat, 
  updateFlat, 
  deleteFlat, 
  deleteImage, 
  getPublicFlats 
} = require('../controllers/flatController'); // Adjust path as needed

const Flat = require('../models/Flat');

// Mock the Flat model
jest.mock('../models/Flat');

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
});