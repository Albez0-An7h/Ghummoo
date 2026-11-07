const mongoose = require('mongoose');
const { assetSchema, paletteSchema, landmarkSchema } = require('./contentSchemas');
const { EXPERIENCES, PLACE_KINDS, PLACE_TYPES } = require('./contentConstants');

// A city or destination in the India content directory. Editorial reference data, kept
// separate from organiser packages: a package points at places (TripPackage.destinationRefs,
// departureCityRefs); places never store package IDs, so the relationship can't go stale.
//
//   kind: 'city'        a city travellers depart from or visit (Delhi, Jaipur, Chandigarh)
//   kind: 'destination' a place a trip goes to (Manali, Spiti Valley, Kaziranga)
//   featured: true      one of the curated city-directory entries, which must be complete
const placeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    kind: { type: String, enum: PLACE_KINDS, required: true, index: true },
    placeType: { type: String, enum: PLACE_TYPES, required: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, default: 'India', trim: true },
    featured: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 },
    // Lowercase alternative names used to match free-text package fields (e.g. "cherrapunji").
    aliases: [{ type: String, lowercase: true, trim: true }],
    intro: { type: String, trim: true, maxlength: 600, default: '' },
    theme: {
      name: { type: String, trim: true, default: '' },
      palette: { type: paletteSchema, default: null },
    },
    landscapes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Landscape', index: true }],
    landmarks: [landmarkSchema],
    highlights: [{ type: String, trim: true, maxlength: 120 }],
    experiences: [{ type: String, enum: EXPERIENCES }],
    // "Nearby" means commonly visited together or from here. No distance or travel time is implied.
    nearby: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Place' }],
    assets: [assetSchema],
    contentStatus: { type: String, enum: ['draft', 'published'], default: 'published' },
  },
  { timestamps: true }
);

// Directory cities must be complete enough to render a city page honestly.
placeSchema.pre('validate', function completeFeatured(next) {
  if (this.featured) {
    if (this.kind !== 'city') this.invalidate('featured', 'Only cities can be featured in the city directory');
    if (!this.intro) this.invalidate('intro', `${this.name}: a featured city needs an introduction`);
    if (!this.theme?.palette) this.invalidate('theme.palette', `${this.name}: a featured city needs a palette`);
    if (!this.landmarks?.length) this.invalidate('landmarks', `${this.name}: a featured city needs landmarks`);
    if (!this.landscapes?.length) this.invalidate('landscapes', `${this.name}: a featured city needs a landscape`);
  }
  next();
});

module.exports = mongoose.model('Place', placeSchema);
