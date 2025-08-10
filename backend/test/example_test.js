
const chai = require('chai');
const chaiHttp = require('chai-http');
const http = require('http');
const app = require('../server'); 
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const sinon = require('sinon');
const Flat = require('../models/Flat');
const { updateFlat,getFlats,addFlat,deleteFlat } = require('../controllers/flatController');
const { expect } = chai;

chai.use(chaiHttp);
let server;
let port;


describe('AddFlat Function Test', () => {
  afterEach(() => sinon.restore());

  it('should create a new flat successfully', async () => {
    // Mock request data
    const req = {
      user: { id: new mongoose.Types.ObjectId() },
      body: { flatNo: "New Flat", description: "Flat description", inspectionDate: "2025-12-31" }
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
    expect(createStub.calledOnceWith({ userId: req.user.id, ...req.body })).to.be.true;
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
      body: { flatNo: "New Flat", description: "Flat description", inspectionDate: "2025-12-31" }
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
      flatNo: "Old Flat",
      description: "Old Description",
      vacant: false,
      inspectionDate: new Date(),
      save: sinon.stub().resolvesThis(), // Mock save method
    };
    // Stub Flat.findById to return mock flat
    const findByIdStub = sinon.stub(Flat, 'findById').resolves(existingFlat);

    // Mock request & response
    const req = {
      params: { id: flatId },
      body: { flatNo: "New Flat", vacant: true }
    };
    const res = {
      json: sinon.spy(), 
      status: sinon.stub().returnsThis()
    };

    // Call function
    await updateFlat(req, res);

    // Assertions
    expect(existingFlat.flatNo).to.equal("New Flat");
    expect(existingFlat.vacant).to.equal(true);
    expect(res.status.called).to.be.false; // No error status should be set
    expect(res.json.calledOnce).to.be.true;

    // Restore stubbed methods
    findByIdStub.restore();
  });



  it('should return 404 if flat is not found', async () => {
    const findByIdStub = sinon.stub(Flat, 'findById').resolves(null);

    const req = { params: { id: new mongoose.Types.ObjectId() }, body: {} };
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
    const findByIdStub = sinon.stub(Flat, 'findById').throws(new Error('DB Error'));

    const req = { params: { id: new mongoose.Types.ObjectId() }, body: {} };
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
      { _id: new mongoose.Types.ObjectId(), flatNo: "Flat 1", userId },
      { _id: new mongoose.Types.ObjectId(), flatNo: "Flat 2", userId }
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

});