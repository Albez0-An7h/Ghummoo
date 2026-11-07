const mongoose = require('mongoose');
const { assetSchema, paletteSchema } = require('./contentSchemas');

const { CATEGORIES } = require('./TripPackage');

// One of the six India landscape themes (Himalayas, Rivers & valleys, ...). Editorial
// reference data seeded from server/src/content/india.js.
const landscapeSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    order: { type: Number, default: 0 },
    tagline: { type: String, trim: true, maxlength: 120, default: '' },
    intro: { type: String, trim: true, maxlength: 600, default: '' },
    palette: { type: paletteSchema, required: true },
    // Package categories that usually belong to this landscape. Used only as a secondary
    // signal; the authoritative link is TripPackage.destinationRefs → Place.landscapes.
    packageCategories: [{ type: String, enum: CATEGORIES }],
    assets: [assetSchema],
    contentStatus: { type: String, enum: ['draft', 'published'], default: 'published' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Landscape', landscapeSchema);
