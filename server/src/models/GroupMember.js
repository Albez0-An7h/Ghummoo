const mongoose = require('mongoose');

// Per-person state inside a group: read position, mute and "left". It is NOT what grants
// access; eligibility is checked live against bookings on every request.
const groupMemberSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'TripGroup', required: true },
    departure: { type: mongoose.Schema.Types.ObjectId, ref: 'TripDeparture', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lastReadAt: { type: Date, default: null },
    muted: { type: Boolean, default: false },
    leftAt: { type: Date, default: null },
  },
  { timestamps: true }
);
groupMemberSchema.index({ group: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('GroupMember', groupMemberSchema);
