const express = require('express');
const { getFlats, addFlat, updateFlat, deleteFlat } = require('../controllers/flatController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').get(protect, getFlats).post(protect, addFlat);
router.route('/:id').put(protect, updateFlat).delete(protect, deleteFlat);

module.exports = router;