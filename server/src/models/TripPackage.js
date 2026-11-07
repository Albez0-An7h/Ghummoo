const mongoose = require('mongoose');

const CATEGORIES = ['weekend', 'mountains', 'adventure', 'international', 'cultural', 'beach', 'wildlife', 'spiritual', 'trek'];

const itineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, min: 1 },
    title: { type: String, trim: true, required: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 3000, default: '' },
    meals: { type: String, trim: true, default: '' },
    stay: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const tripPackageSchema = new mongoose.Schema(
  {
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator', required: true, index: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, index: true },
    destination: { type: String, trim: true, default: '' },
    region: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'India' },
    startLocation: { type: String, trim: true, default: '' },
    // Structured links to the India content directory (V0.1). Optional and additive: the
    // free-text fields above stay the organiser's own wording. Empty means "not linked yet",
    // never "nowhere". Places outside the directory (e.g. Bali) simply stay unlinked.
    destinationRefs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Place', index: true }],
    departureCityRefs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Place', index: true }],
    categories: [{ type: String, enum: CATEGORIES }],
    durationDays: { type: Number, min: 1, max: 60, default: null },
    durationNights: { type: Number, min: 0, max: 60, default: null },
    basePrice: { type: Number, min: 0, default: null },
    currency: { type: String, default: 'INR', uppercase: true },
    coverImage: { type: String, default: '' },
    images: [{ type: String }],
    summary: { type: String, trim: true, maxlength: 300, default: '' },
    overview: { type: String, trim: true, maxlength: 5000, default: '' },
    highlights: [{ type: String, trim: true }],
    itinerary: [itineraryDaySchema],
    accommodation: { type: String, trim: true, default: '' },
    transport: { type: String, trim: true, default: '' },
    meals: { type: String, trim: true, default: '' },
    inclusions: [{ type: String, trim: true }],
    exclusions: [{ type: String, trim: true }],
    pickupInfo: { type: String, trim: true, default: '' },
    cancellationPolicy: { type: String, trim: true, default: '' },
    groupSize: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['draft', 'published', 'unpublished', 'removed'], default: 'draft', index: true },
    removedReason: { type: String, default: '' },
    source: { type: String, enum: ['manual', 'ai'], default: 'manual' },
    aiWarnings: [{ type: String }],
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

tripPackageSchema.statics.CATEGORIES = CATEGORIES;

// Fields that must exist before a package may be published.
tripPackageSchema.methods.publishBlockers = function publishBlockers(departureCount) {
  const missing = [];
  if (!this.title) missing.push('Title');
  if (!this.destination) missing.push('Destination');
  if (!this.durationDays) missing.push('Duration');
  if (this.basePrice == null) missing.push('Price');
  if (!this.coverImage) missing.push('Cover photo');
  if (!this.overview && !this.summary) missing.push('Overview');
  if (!this.itinerary || this.itinerary.length === 0) missing.push('Itinerary');
  if (!this.inclusions || this.inclusions.length === 0) missing.push('Inclusions');
  if (!this.cancellationPolicy) missing.push('Cancellation policy');
  if (!departureCount) missing.push('At least one departure');
  return missing;
};

module.exports = mongoose.model('TripPackage', tripPackageSchema);
