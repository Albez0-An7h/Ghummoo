const mongoose = require('mongoose');

// Persistent updates board for one departure. Visible to its operator and to travellers
// holding a confirmed booking on that departure.
const announcementSchema = new mongoose.Schema(
  {
    departure: { type: mongoose.Schema.Types.ObjectId, ref: 'TripDeparture', required: true, index: true },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'TripPackage', required: true },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator', required: true },
    kind: { type: String, enum: ['announcement', 'pickup', 'instruction', 'itinerary'], default: 'announcement' },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 140 },
    body: { type: String, required: [true, 'Message is required'], trim: true, maxlength: 4000 },
    pinned: { type: Boolean, default: false },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TripAnnouncement', announcementSchema);
