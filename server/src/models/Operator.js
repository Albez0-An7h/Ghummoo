const mongoose = require('mongoose');

// A travel business. One user (role operator) owns one Operator profile.
const operatorSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: [true, 'Business name is required'], trim: true, maxlength: 120 },
    // What kind of organiser this is (V0.1 onboarding). Optional for profiles created earlier.
    organiserType: { type: String, enum: ['independent', 'company', 'community', 'creator', null], default: null },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    contactEmail: { type: String, trim: true, lowercase: true, default: '' },
    contactPhone: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    instagram: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    logoUrl: { type: String, trim: true, default: '' },
    foundedYear: { type: Number, default: null },
    // Listing approval by an admin. Only approved operators appear publicly.
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    statusNote: { type: String, default: '' },
    // Set only when an admin has reviewed verification documents. The public "Verified" badge
    // also requires listing approval (see services/trips.js#isVerified).
    verifiedAt: { type: Date, default: null },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Operator', operatorSchema);
