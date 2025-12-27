const mongoose = require('mongoose');

const adminProfileSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    default: ''
  },
  expertise: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  isOnline: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Add indexes for better query performance
adminProfileSchema.index({ isOnline: 1 }); // For querying online admins
adminProfileSchema.index({ rating: -1 }); // For sorting by rating

module.exports = mongoose.model('AdminProfile', adminProfileSchema);