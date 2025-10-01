const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    vacant: { type: Boolean, default: true },
    inspectionDate: { type: Date },
    images: [String],
    
    tenantDetails: {
        name: { type: String },
        email: { type: String },
        phone: { type: String },
        moveInDate: { type: Date },
        rentAmount: { type: Number }
    },
    
    maintenanceReports: [{
        id: String, 
        issueType: String,
        description: String,
        priority: String,
        contractorId: String,
        contractorName: String,
        contractorPhone: String,
        status: { type: String, default: 'reported' },
        estimatedCost: Number,
        actualCost: Number,
        scheduledDate: Date,
        completionDate: Date,
        reportedDate: { type: Date, default: Date.now },
        lastUpdated: Date,
        notes: String,
        images: [String]
    }],
    
    paymentLogs: [{
        id: String,
        amount: Number,
        paymentDate: Date,
        paymentMethod: String,
        description: String,
        invoiceId: String,
        recordedDate: { type: Date, default: Date.now }
    }],
    
    invoices: [{
        id: String,
        type: { type: String, enum: ['rental', 'maintenance'] },
        tenantName: String,
        tenantEmail: String,
        flatTitle: String,
        amount: Number,
        dueDate: Date,
        issueDate: { type: Date, default: Date.now },
        status: { type: String, default: 'pending' },
        paidDate: Date,
        description: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Flat', flatSchema);