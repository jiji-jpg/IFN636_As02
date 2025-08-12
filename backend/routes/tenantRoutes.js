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

router.use(authenticate);
router.get('/', getTenants);
router.get('/flat/:flatId', getTenantsByFlat);
router.get('/:id', getTenantById);
router.put('/:id', updateTenant);
router.delete('/:id', deleteTenant);

module.exports = router;