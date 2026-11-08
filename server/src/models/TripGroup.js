const mongoose = require('mongoose');

// One private group per departure. Created when the first traveller is confirmed (or safely on
// demand). Membership is never stored as a list here: it is derived on every request from the
// departure's organiser and its confirmed bookings (see services/groups.js).
const tripGroupSchema = new mongoose.Schema(
  {
    departure: { type: mongoose.Schema.Types.ObjectId, ref: 'TripDeparture', required: true, unique: true },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'TripPackage', required: true },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator', required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TripGroup', tripGroupSchema);
