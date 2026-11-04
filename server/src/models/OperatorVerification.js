const mongoose = require('mongoose');

// Business verification details submitted by an operator, reviewed by an admin.
const verificationSchema = new mongoose.Schema(
  {
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator', required: true, index: true },
    registrationType: { type: String, enum: ['gst', 'msme', 'company', 'tourism_license', 'other'], required: true },
    registrationNumber: { type: String, required: [true, 'Registration number is required'], trim: true, maxlength: 60 },
    legalName: { type: String, trim: true, maxlength: 160, default: '' },
    documentUrl: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, maxlength: 1000, default: '' },
    status: { type: String, enum: ['submitted', 'verified', 'rejected'], default: 'submitted' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewNote: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OperatorVerification', verificationSchema);
