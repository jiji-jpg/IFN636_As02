const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const fs = require('fs');
const { expect } = chai;

const Flat = require('../models/Flat');
const { 
  getFlats, 
  addFlat, 
  updateFlat, 
  deleteFlat, 
  deleteImage
} = require('../controllers/flatController');

describe('Flat Controller Tests', () => {
  
  afterEach(() => {
    sinon.restore();
  });

  // 2 TESTS FOR ADDFLAT
  describe('AddFlat Function Test', () => {
    
    it('should create a new flat successfully', async () => {
      const req = {
        user: { id: new mongoose.Types.ObjectId() },
        body: { title: "Beautiful 2BR Apartment", description: "Spacious apartment", inspectionDate: "2024-08-15" },
        files: [{ filename: 'image1.jpg' }]
      };

      const createdFlat = { 
        _id: new mongoose.Types.ObjectId(), 
        userId: req.user.id,
        title: req.body.title,
        description: req.body.description,
        inspectionDate: req.body.inspectionDate,
        images: ['image1.jpg']
      };

      sinon.stub(Flat, 'create').resolves(createdFlat);
      sinon.stub(console, 'log');
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await addFlat(req, res);

      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith(createdFlat)).to.be.true;
    });

    it('should return 400 if title is missing', async () => {
      const req = {
        user: { id: new mongoose.Types.ObjectId() },
        body: { description: "Apartment without title" },
        files: []
      };

      sinon.stub(console, 'log');
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await addFlat(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Title is required' })).to.be.true;
    });
  });

  // 4 TESTS FOR UPDATEFLAT
  describe('UpdateFlat Function Test', () => {
    
    it('should update flat successfully', async () => {
      const flatId = new mongoose.Types.ObjectId();
      const existingFlat = {
        _id: flatId,
        title: "Old Title",
        description: "Old Description",
        vacant: false,
        save: sinon.stub().resolvesThis()
      };

      sinon.stub(Flat, 'findById').resolves(existingFlat);
      sinon.stub(console, 'log');

      const req = {
        params: { id: flatId },
        body: { title: "Updated Title", description: "Updated Description", vacant: true },
        files: []
      };
      
      const res = {
        json: sinon.spy(), 
        status: sinon.stub().returnsThis()
      };

      await updateFlat(req, res);

      expect(existingFlat.title).to.equal("Updated Title");
      expect(existingFlat.vacant).to.equal(true);
      expect(res.json.calledOnce).to.be.true;
    });

    it('should return 404 if flat is not found', async () => {
      sinon.stub(Flat, 'findById').resolves(null);
      sinon.stub(console, 'log');

      const req = { 
        params: { id: new mongoose.Types.ObjectId() }, 
        body: { title: "Updated Title" },
        files: []
      };
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await updateFlat(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Flat not found' })).to.be.true;
    });

    it('should return 500 on error', async () => {
      sinon.stub(Flat, 'findById').throws(new Error('DB Error'));
      sinon.stub(console, 'log');
      sinon.stub(console, 'error');

      const req = { 
        params: { id: new mongoose.Types.ObjectId() }, 
        body: { title: "Updated Title" },
        files: []
      };
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await updateFlat(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.called).to.be.true;
    });

    it('should add new images to existing ones', async () => {
      const flatId = new mongoose.Types.ObjectId();
      const existingFlat = {
        _id: flatId,
        images: ['old.jpg'],
        save: sinon.stub().resolvesThis()
      };

      sinon.stub(Flat, 'findById').resolves(existingFlat);
      sinon.stub(console, 'log');

      const req = {
        params: { id: flatId },
        body: {},
        files: [{ filename: 'new.jpg' }]
      };
      
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };

      await updateFlat(req, res);

      expect(existingFlat.images).to.deep.equal(['old.jpg', 'new.jpg']);
      expect(existingFlat.save.calledOnce).to.be.true;
    });
  });

  // 4 TESTS FOR GETFLATS
  describe('GetFlats Function Test', () => {
    
    it('should return flats for the given user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const flats = [
        { _id: new mongoose.Types.ObjectId(), title: "Flat 1", userId },
        { _id: new mongoose.Types.ObjectId(), title: "Flat 2", userId }
      ];

      sinon.stub(Flat, 'find').resolves(flats);

      const req = { user: { id: userId } };
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };

      await getFlats(req, res);

      expect(res.json.calledWith(flats)).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should return empty array when user has no flats', async () => {
      const userId = new mongoose.Types.ObjectId();
      sinon.stub(Flat, 'find').resolves([]);

      const req = { user: { id: userId } };
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };

      await getFlats(req, res);

      expect(res.json.calledWith([])).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should return 500 on error', async () => {
      sinon.stub(Flat, 'find').throws(new Error('DB Error'));

      const req = { user: { id: new mongoose.Types.ObjectId() } };
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };

      await getFlats(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
    });

    it('should call find with correct userId', async () => {
      const userId = new mongoose.Types.ObjectId();
      const findStub = sinon.stub(Flat, 'find').resolves([]);

      const req = { user: { id: userId } };
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };

      await getFlats(req, res);

      expect(findStub.calledOnceWith({ userId })).to.be.true;
    });
  });

  // 4 TESTS FOR DELETEFLAT
  describe('DeleteFlat Function Test', () => {
    
    it('should delete a flat successfully', async () => {
      const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
      const flat = { remove: sinon.stub().resolves() };

      sinon.stub(Flat, 'findById').resolves(flat);

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await deleteFlat(req, res);

      expect(flat.remove.calledOnce).to.be.true;
      expect(res.json.calledWith({ message: 'Flat deleted' })).to.be.true;
    });

    it('should return 404 if flat is not found', async () => {
      sinon.stub(Flat, 'findById').resolves(null);

      const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await deleteFlat(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Flat not found' })).to.be.true;
    });

    it('should return 500 if an error occurs', async () => {
      sinon.stub(Flat, 'findById').throws(new Error('DB Error'));

      const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await deleteFlat(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
    });

    it('should call findById with correct id', async () => {
      const flatId = new mongoose.Types.ObjectId().toString();
      const findByIdStub = sinon.stub(Flat, 'findById').resolves(null);

      const req = { params: { id: flatId } };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await deleteFlat(req, res);

      expect(findByIdStub.calledOnceWith(flatId)).to.be.true;
    });
  });

  // 4 TESTS FOR DELETEIMAGE
  describe('DeleteImage Function Test', () => {
    
    it('should delete image successfully', async () => {
      const userId = new mongoose.Types.ObjectId();
      const flat = {
        userId: userId,
        images: ['img1.jpg', 'img2.jpg'],
        save: sinon.stub().resolvesThis()
      };

      sinon.stub(Flat, 'findById').resolves(flat);
      sinon.stub(fs, 'unlink').yields(null);
      sinon.stub(console, 'log');

      const req = {
        params: { id: new mongoose.Types.ObjectId(), imageName: 'img1.jpg' },
        user: { id: userId.toString() }
      };

      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };

      await deleteImage(req, res);

      expect(flat.images).to.deep.equal(['img2.jpg']);
      expect(res.json.calledWithMatch({ message: 'Image deleted successfully' })).to.be.true;
    });

    it('should return 404 if flat not found', async () => {
      sinon.stub(Flat, 'findById').resolves(null);
      sinon.stub(console, 'log');

      const req = {
        params: { id: new mongoose.Types.ObjectId(), imageName: 'image.jpg' },
        user: { id: 'userId' }
      };

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await deleteImage(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Flat not found' })).to.be.true;
    });

    it('should return 403 if user not authorized', async () => {
      const flat = {
        userId: new mongoose.Types.ObjectId(),
        images: ['img.jpg']
      };

      sinon.stub(Flat, 'findById').resolves(flat);
      sinon.stub(console, 'log');

      const req = {
        params: { id: new mongoose.Types.ObjectId(), imageName: 'img.jpg' },
        user: { id: new mongoose.Types.ObjectId().toString() }
      };

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await deleteImage(req, res);

      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'Not authorized to delete this image' })).to.be.true;
    });

    it('should handle file deletion errors gracefully', async () => {
      const userId = new mongoose.Types.ObjectId();
      const flat = {
        userId: userId,
        images: ['img.jpg'],
        save: sinon.stub().resolvesThis()
      };

      sinon.stub(Flat, 'findById').resolves(flat);
      sinon.stub(fs, 'unlink').yields(new Error('File not found'));
      sinon.stub(console, 'log');
      sinon.stub(console, 'error');

      const req = {
        params: { id: new mongoose.Types.ObjectId(), imageName: 'img.jpg' },
        user: { id: userId.toString() }
      };

      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };

      await deleteImage(req, res);

      expect(flat.images).to.deep.equal([]);
      expect(res.json.calledOnce).to.be.true; // Still returns success
    });
  });

  // NOTE: addImage and updateImage functions don't exist in your controller
  // If you need these functions, you'll need to implement them in flatController.js first
});