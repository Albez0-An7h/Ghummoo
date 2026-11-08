const mongoose = require('mongoose');

// A message in a trip group. `announcement` messages can only be posted by the organiser.
// Messages never carry booking or payment data; the API also rejects phone numbers and payment
// identifiers in the text.
const groupMessageSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'TripGroup', required: true },
    departure: { type: mongoose.Schema.Types.ObjectId, ref: 'TripDeparture', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorRole: { type: String, enum: ['organiser', 'traveller'], required: true },
    kind: { type: String, enum: ['message', 'announcement'], default: 'message' },
    body: { type: String, required: true, trim: true, minlength: 1, maxlength: 1000 },
    hidden: { type: Boolean, default: false }, // set by moderation
  },
  { timestamps: true }
);
groupMessageSchema.index({ group: 1, createdAt: 1 });

module.exports = mongoose.model('GroupMessage', groupMessageSchema);
