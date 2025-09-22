const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import existing flat and tenant controllers
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

// Import new payment controller
const {
    generateInvoice,
    recordPayment,
    getPaymentLogs,
    deletePayment,
    getArrearsTracking,
    getInvoices
} = require('../controllers/paymentController');

// Import new maintenance controller
const {
    reportMaintenance,
    getMaintenanceReports,
    updateMaintenanceStatus,
    getAllMaintenanceReports,
    getContractors,
    deleteMaintenanceReport
} = require('../controllers/maintenanceController');

const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Create uploads directories
const uploadsDir = path.join(__dirname, '../uploads/flats');
const maintenanceUploadsDir = path.join(__dirname, '../uploads/maintenance');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(maintenanceUploadsDir)) {
    fs.mkdirSync(maintenanceUploadsDir, { recursive: true });
}

// Configure multer for flat images
const flatImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/flats/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

// Configure multer for maintenance images
const maintenanceImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/maintenance/');
    },
    filename: (req, file, cb) => {
        const uniqueName = 'maintenance-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

// Multer upload configurations
const uploadFlatImages = multer({ 
    storage: flatImageStorage,
    limits: { 
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 10 // Max 10 files
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

const uploadMaintenanceImages = multer({ 
    storage: maintenanceImageStorage,
    limits: { 
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 5 // Max 5 files for maintenance reports
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// ================== EXISTING FLAT ROUTES ==================
router.route('/')
    .get(protect, getFlats)
    .post(protect, uploadFlatImages.array('images', 10), addFlat);

router.route('/:id')
    .put(protect, uploadFlatImages.array('images', 10), updateFlat)
    .delete(protect, deleteFlat);

router.route('/:id/images/:imageName')
    .delete(protect, deleteImage);

router.get('/public/all', getPublicFlats);

// ================== TENANT ROUTES ==================
router.route('/:flatId/tenant')
    .post(protect, addTenant)
    .get(protect, getTenant)
    .put(protect, updateTenant)
    .delete(protect, removeTenant);

router.get('/tenants/all', protect, getAllTenants);

// ================== PAYMENT TRACKING ROUTES ==================
// Invoice management
router.route('/:flatId/invoices')
    .post(protect, generateInvoice)
    .get(protect, getInvoices);

// Payment management
router.route('/:flatId/payments')
    .post(protect, recordPayment)
    .get(protect, getPaymentLogs);

router.route('/:flatId/payments/:paymentId')
    .delete(protect, deletePayment);

// Arrears tracking - this needs to be before the /:flatId routes to avoid conflicts
router.get('/arrears/tracking', protect, getArrearsTracking);

// ================== MAINTENANCE ROUTES ==================
// Contractors - this needs to be before the /:flatId routes to avoid conflicts
router.get('/contractors/list', protect, getContractors);

// All maintenance reports across all flats - this needs to be before the /:flatId routes
router.get('/maintenance/all', protect, getAllMaintenanceReports);

// Maintenance reports for specific flat
router.route('/:flatId/maintenance')
    .post(protect, uploadMaintenanceImages.array('images', 5), reportMaintenance)
    .get(protect, getMaintenanceReports);

// Update maintenance status
router.route('/:flatId/maintenance/:reportId')
    .put(protect, updateMaintenanceStatus)
    .delete(protect, deleteMaintenanceReport);

// ================== ERROR HANDLING MIDDLEWARE ==================
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ message: 'Too many files. Maximum is 10 files for flats and 5 for maintenance.' });
        }
    }
    
    if (error.message === 'Only image files are allowed!') {
        return res.status(400).json({ message: 'Only image files are allowed.' });
    }
    
    console.error('Router error:', error);
    res.status(500).json({ message: 'Internal server error' });
});

module.exports = router;