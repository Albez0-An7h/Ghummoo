const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['package', 'operator', 'booking'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, enum: ['misleading', 'pricing', 'safety', 'fraud', 'other'], required: true },
    details: { type: String, trim: true, maxlength: 2000, default: '' },
    status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open', index: true },
    resolutionNote: { type: String, default: '' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
