const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  flatId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Flat', 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String 
  },
  phone: { 
    type: String 
  },
  moveInDate: { 
    type: Date 
  },
  moveOutDate: { 
    type: Date 
  },
  rentAmount: { 
    type: Number 
  },
  depositAmount: { 
    type: Number 
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  notes: { 
    type: String 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Tenant', tenantSchema);