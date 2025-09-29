const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  getFlats, 
  addFlat, 
  updateFlat, 
  deleteFlat, 
  deleteImage, 
  getPublicFlats,
  addTenant,
  getTenant,
  updateTenant,
  removeTenant,
  getAllTenants
} = require('../controllers/flatController');

const { 
  reportMaintenance,
  getMaintenanceReports,
  updateMaintenanceStatus,
  getAllMaintenanceReports,
  getContractors,
  deleteMaintenanceReport
} = require('../controllers/maintenanceController');

const {
  generateInvoice,
  recordPayment,
  getPaymentLogs,
  deletePayment,
  getArrearsTracking,
  getInvoices
} = require('../controllers/paymentController');

const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Create uploads directories
const flatsUploadsDir = path.join(__dirname, '../uploads/flats');
const maintenanceUploadsDir = path.join(__dirname, '../uploads/maintenance');

if (!fs.existsSync(flatsUploadsDir)) {
  fs.mkdirSync(flatsUploadsDir, { recursive: true });
}
if (!fs.existsSync(maintenanceUploadsDir)) {
  fs.mkdirSync(maintenanceUploadsDir, { recursive: true });
}

// Configure multer for flat images
const flatStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/flats/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const flatUpload = multer({ 
  storage: flatStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024,
    files: 10
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Configure multer for maintenance images
const maintenanceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/maintenance/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const maintenanceUpload = multer({ 
  storage: maintenanceStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024,
    files: 10
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// ============================================
// FLAT ROUTES
// ============================================
router.route('/')
  .get(protect, getFlats)
  .post(protect, flatUpload.array('images', 10), addFlat);

router.route('/public')
  .get(getPublicFlats);

router.route('/:id')
  .put(protect, flatUpload.array('images', 10), updateFlat)
  .delete(protect, deleteFlat);

router.route('/:id/images/:imageName')
  .delete(protect, deleteImage);

// ============================================
// TENANT ROUTES
// ============================================
router.route('/tenants/all')
  .get(protect, getAllTenants);

router.route('/:flatId/tenants')
  .post(protect, addTenant)
  .get(protect, getTenant)
  .put(protect, updateTenant)
  .delete(protect, removeTenant);

// ============================================
// MAINTENANCE ROUTES
// ============================================
router.route('/contractors/list')
  .get(protect, getContractors);

router.route('/maintenance/all')
  .get(protect, getAllMaintenanceReports);

router.route('/:flatId/maintenance')
  .post(protect, maintenanceUpload.array('images', 10), reportMaintenance)
  .get(protect, getMaintenanceReports);

router.route('/:flatId/maintenance/:reportId')
  .put(protect, updateMaintenanceStatus)
  .delete(protect, deleteMaintenanceReport);

// ============================================
// PAYMENT & INVOICE ROUTES
// ============================================
router.route('/arrears/tracking')
  .get(protect, getArrearsTracking);

router.route('/:flatId/invoices')
  .post(protect, generateInvoice)
  .get(protect, getInvoices);

router.route('/:flatId/payments')
  .post(protect, recordPayment)
  .get(protect, getPaymentLogs);

router.route('/:flatId/payments/:paymentId')
  .delete(protect, deletePayment);

module.exports = router;