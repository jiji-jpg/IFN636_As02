const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getFlats, addFlat, updateFlat, deleteFlat, deleteImage, getPublicFlats } = require('../controllers/flatController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/flats');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/flats/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
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

// Routes with multer middleware
router.route('/').get(protect, getFlats).post(protect, upload.array('images', 10), addFlat);
router.route('/:id').put(protect, upload.array('images', 10), updateFlat).delete(protect, deleteFlat);
router.route('/:id/images/:imageName').delete(protect, deleteImage);

// Public listings route (no authentication required) - ADD THIS LINE
router.get('/public', getPublicFlats);

module.exports = router;