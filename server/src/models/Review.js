const mongoose = require('mongoose');

// Only travellers with a confirmed booking whose trip has ended may review. One per booking.
const reviewSchema = new mongoose.Schema(
  {
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'TripPackage', required: true, index: true },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator', required: true, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 2000, default: '' },
    hidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
