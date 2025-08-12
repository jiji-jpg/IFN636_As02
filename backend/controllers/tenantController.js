const Tenant = require('../models/Tenant');
const Flat = require('../models/Flat');

// View all tenants with their flat info
const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({ userId: req.user.id })
      .populate('flatId', 'title description images')
      .sort({ createdAt: -1 });
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// View single tenant with flat details
const getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id)
      .populate('flatId', 'title description images vacant');
    
    if (!tenant || tenant.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update tenant (NO ADD functionality as requested)
const updateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant || tenant.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    // Update only the fields provided
    const allowedUpdates = ['name', 'email', 'phone', 'rentAmount', 'depositAmount', 'emergencyContact', 'notes'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        tenant[field] = req.body[field];
      }
    });
    
    const updatedTenant = await tenant.save();
    
    // Return with populated flat info
    await updatedTenant.populate('flatId', 'title description images');
    res.json(updatedTenant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete tenant
const deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant || tenant.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    // Update the flat to vacant
    const flat = await Flat.findById(tenant.flatId);
    if (flat) {
      flat.vacant = true;
      flat.tenantDetails = null;
      await flat.save();
    }
    
    await Tenant.deleteOne({ _id: req.params.id });
    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get tenants by flat (useful for flat detail page)
const getTenantsByFlat = async (req, res) => {
  try {
    const tenants = await Tenant.find({ 
      flatId: req.params.flatId,
      userId: req.user.id 
    }).sort({ createdAt: -1 });
    
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getTenants, 
  getTenantById,
  updateTenant, 
  deleteTenant,
  getTenantsByFlat
};