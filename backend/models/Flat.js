const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    vacant: { type: Boolean, default: true },
    inspectionDate: { type: Date },
    images: [String],
    
    // Add tenant details
    tenantDetails: {
        name: { type: String },
        email: { type: String },
        phone: { type: String },
        moveInDate: { type: Date },
        rentAmount: { type: Number }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Flat', flatSchema);