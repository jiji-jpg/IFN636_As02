const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { 
  getTenants, 
  getTenantById,
  updateTenant, 
  deleteTenant,
  getTenantsByFlat
} = require('../controllers/tenantController');

// Apply authentication to all routes
router.use(authenticate);

// View all tenants
router.get('/', getTenants);

// View tenants by flat
router.get('/flat/:flatId', getTenantsByFlat);

// View single tenant
router.get('/:id', getTenantById);

// Update tenant (NO POST/ADD route as requested)
router.put('/:id', updateTenant);

// Delete tenant
router.delete('/:id', deleteTenant);

module.exports = router;