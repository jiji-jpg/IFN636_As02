// backend/models/Flat.js
const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
    },
    vacant: { 
        type: Boolean, 
        default: true 
    },
    inspectionDate: { 
        type: Date 
    },
    images: [String],
    
    // Tenant details
    tenantDetails: {
        name: { type: String },
        email: { type: String },
        phone: { type: String },
        moveInDate: { type: Date },
        rentAmount: { type: Number }
    },
    
    // Invoices array - THIS WAS MISSING
    invoices: [{
        id: { type: String, required: true },
        type: { type: String, enum: ['rental', 'maintenance'], required: true },
        tenantName: { type: String },
        tenantEmail: { type: String },
        flatTitle: { type: String },
        flatId: { type: mongoose.Schema.Types.ObjectId },
        amount: { type: Number, required: true },
        dueDate: { type: Date, required: true },
        issueDate: { type: Date, default: Date.now },
        paidDate: { type: Date },
        status: { 
            type: String, 
            enum: ['pending', 'paid', 'overdue'], 
            default: 'pending' 
        },
        description: { type: String }
    }],
    
    // Payment logs array - THIS WAS MISSING
    paymentLogs: [{
        id: { type: String, required: true },
        amount: { type: Number, required: true },
        paymentDate: { type: Date, required: true },
        paymentMethod: { 
            type: String, 
            enum: ['bank_transfer', 'cash', 'check', 'online', 'card'],
            required: true 
        },
        description: { type: String },
        invoiceId: { type: String },
        recordedDate: { type: Date, default: Date.now }
    }],
    
    // Maintenance reports array - THIS WAS MISSING
    maintenanceReports: [{
        id: { type: String, required: true },
        issueType: { 
            type: String, 
            enum: ['plumbing', 'electrical', 'heating', 'cooling', 'appliance', 'structural', 'pest_control', 'cleaning', 'painting', 'carpentry', 'other'],
            required: true 
        },
        description: { type: String, required: true },
        priority: { 
            type: String, 
            enum: ['low', 'medium', 'high', 'urgent'],
            required: true 
        },
        contractorId: { type: String, required: true },
        contractorName: { type: String },
        contractorPhone: { type: String },
        status: { 
            type: String, 
            enum: ['reported', 'assigned', 'in_progress', 'completed', 'cancelled'],
            default: 'reported' 
        },
        estimatedCost: { type: Number },
        actualCost: { type: Number },
        scheduledDate: { type: Date },
        reportedDate: { type: Date, default: Date.now },
        completionDate: { type: Date },
        lastUpdated: { type: Date },
        notes: { type: String },
        images: [String]
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Flat', flatSchema);