const mongoose = require('mongoose');

// Daily public view count per listing (one document per package per Indian calendar day).
// Counted on the public trip page only; organisers and admins viewing their own listings, and
// obvious bots, are not counted. Repeat visits by the same person do count: this is a page-view
// figure, not unique visitors, and the insights page says so.
const listingViewSchema = new mongoose.Schema(
  {
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'TripPackage', required: true },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator', required: true, index: true },
    day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    count: { type: Number, default: 0, min: 0 },
  },
  { timestamps: false }
);
listingViewSchema.index({ package: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('ListingView', listingViewSchema);
