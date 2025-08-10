const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    vacant: { type: Boolean, default: false },
    inspectionDate: { type: Date },
    images: [String],
});

module.exports = mongoose.model('Flat', flatSchema);