const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const fs = require('fs');
const Flat = require('../models/Flat');
const { getFlats, addFlat, updateFlat, deleteFlat, deleteImage, getPublicFlats } = require('../controllers/flatController');

describe('Flat Controller Tests', () => {
  let req, res, stub;
  
  beforeEach(() => {
    res = { status: sinon.stub().returnsThis(), json: sinon.spy() };
    stub = { log: sinon.stub(console, 'log'), error: sinon.stub(console, 'error') };
  });
  
  afterEach(() => sinon.restore());

  const mockReq = (p = {}, b = {}, u = { id: new mongoose.Types.ObjectId().toString() }) => 
    ({ params: p, body: b, user: u, files: p.files || [] });

  describe('AddFlat', () => {
    it('creates flat successfully', async () => {
      req = mockReq({}, { title: "2BR Apt", description: "Nice" });
      req.files = [{ filename: 'img.jpg' }];
      const flat = { _id: new mongoose.Types.ObjectId(), ...req.body, images: ['img.jpg'] };
      sinon.stub(Flat, 'create').resolves(flat);
      
      await addFlat(req, res);
      
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith(flat)).to.be.true;
    });

    it('fails without title', async () => {
      req = mockReq({}, { description: "No title" });
      await addFlat(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'Title is required' })).to.be.true;
    });
  });

  describe('UpdateFlat', () => {
    const flatId = new mongoose.Types.ObjectId();
    
    it('updates successfully', async () => {
      const flat = { title: "Old", vacant: false, save: sinon.stub().resolvesThis() };
      sinon.stub(Flat, 'findById').resolves(flat);
      req = mockReq({ id: flatId }, { title: "New", vacant: true });
      
      await updateFlat(req, res);
      
      expect(flat.title).to.equal("New");
      expect(flat.vacant).to.be.true;
    });

    it('returns 404 if not found', async () => {
      sinon.stub(Flat, 'findById').resolves(null);
      req = mockReq({ id: flatId }, { title: "New" });
      
      await updateFlat(req, res);
      
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Flat not found' })).to.be.true;
    });

    it('adds images', async () => {
      const flat = { images: ['old.jpg'], save: sinon.stub().resolvesThis() };
      sinon.stub(Flat, 'findById').resolves(flat);
      req = mockReq({ id: flatId });
      req.files = [{ filename: 'new.jpg' }];
      
      await updateFlat(req, res);
      
      expect(flat.images).to.deep.equal(['old.jpg', 'new.jpg']);
    });

    it('handles errors', async () => {
      sinon.stub(Flat, 'findById').throws(new Error('DB Error'));
      req = mockReq({ id: flatId }, { title: "New" });
      
      await updateFlat(req, res);
      
      expect(res.status.calledWith(500)).to.be.true;
    });
  });

  describe('GetFlats', () => {
    it('returns user flats', async () => {
      const flats = [{ title: "Flat 1" }, { title: "Flat 2" }];
      sinon.stub(Flat, 'find').resolves(flats);
      req = mockReq();
      
      await getFlats(req, res);
      
      expect(res.json.calledWith(flats)).to.be.true;
    });

    it('handles errors', async () => {
      sinon.stub(Flat, 'find').throws(new Error('DB Error'));
      req = mockReq();
      
      await getFlats(req, res);
      
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'DB Error' })).to.be.true;
    });
  });

  describe('DeleteFlat', () => {
    it('deletes successfully', async () => {
      const flat = { remove: sinon.stub().resolves() };
      sinon.stub(Flat, 'findById').resolves(flat);
      req = mockReq({ id: new mongoose.Types.ObjectId() });
      
      await deleteFlat(req, res);
      
      expect(flat.remove.calledOnce).to.be.true;
      expect(res.json.calledWith({ message: 'Flat deleted' })).to.be.true;
    });

    it('returns 404 if not found', async () => {
      sinon.stub(Flat, 'findById').resolves(null);
      req = mockReq({ id: new mongoose.Types.ObjectId() });
      
      await deleteFlat(req, res);
      
      expect(res.status.calledWith(404)).to.be.true;
    });
  });

  describe('DeleteImage', () => {
    it('deletes image successfully', async () => {
      const userId = new mongoose.Types.ObjectId();
      const flat = { userId, images: ['img1.jpg', 'img2.jpg'], save: sinon.stub().resolvesThis() };
      sinon.stub(Flat, 'findById').resolves(flat);
      sinon.stub(fs, 'unlink').yields(null);
      req = mockReq({ id: new mongoose.Types.ObjectId(), imageName: 'img1.jpg' }, {}, { id: userId.toString() });
      
      await deleteImage(req, res);
      
      expect(flat.images).to.deep.equal(['img2.jpg']);
      expect(res.json.calledWithMatch({ message: 'Image deleted successfully' })).to.be.true;
    });

    it('returns 403 if unauthorized', async () => {
      const flat = { userId: new mongoose.Types.ObjectId(), images: ['img.jpg'] };
      sinon.stub(Flat, 'findById').resolves(flat);
      req = mockReq({ id: new mongoose.Types.ObjectId(), imageName: 'img.jpg' });
      
      await deleteImage(req, res);
      
      expect(res.status.calledWith(403)).to.be.true;
    });
  });

  describe('GetPublicFlats', () => {
    it('returns all flats with user info', async () => {
      const flats = [{ title: 'Flat 1' }, { title: 'Flat 2' }];
      sinon.stub(Flat, 'find').returns({
        populate: sinon.stub().returns({
          sort: sinon.stub().resolves(flats)
        })
      });
      req = { query: {} };
      
      await getPublicFlats(req, res);
      
      expect(res.json.calledWith(flats)).to.be.true;
    });
  });
});